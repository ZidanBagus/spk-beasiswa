'use strict';

const db = require('../models');
const { Applicant, SelectionResult, SelectionBatch } = db;
const { buildTree, predict, visualizeTree } = require('../utils/c45-engine');

let trainedModel = null;
let calculationSteps = [];

// Fungsi trainModel untuk melatih model C4.5 dari data historis
exports.trainModel = async (req, res) => {
    const { trainingDataIds, selectedAttributeNames } = req.body;
    try {
        const trainingApplicants = await Applicant.findAll({ where: { id: trainingDataIds } });
        if (trainingApplicants.length === 0) {
            return res.status(400).json({ message: "Data latih tidak ditemukan. Harap bagi data terlebih dahulu." });
        }
        const preparedTrainingData = trainingApplicants.map(app => {
            const plainApp = app.toJSON();
            // Menggunakan kolom 'statusBeasiswa' sebagai target/label untuk dipelajari
            return { ...plainApp, statusKelulusan: plainApp.statusBeasiswa }; 
        });
        
        calculationSteps = []; // Reset langkah perhitungan setiap kali model baru dilatih
        trainedModel = buildTree(preparedTrainingData, selectedAttributeNames, null, calculationSteps);
        
        res.status(200).json({ message: `Model berhasil dilatih menggunakan ${preparedTrainingData.length} data historis.` });
    } catch (error) {
        trainedModel = null;
        calculationSteps = [];
        console.error("Error saat melatih model:", error);
        res.status(500).json({ message: "Gagal melatih model.", error: error.message });
    }
};

// Fungsi testModel untuk menguji akurasi model terhadap data uji
exports.testModel = async (req, res) => {
    const { testingDataIds } = req.body;
    if (!trainedModel) {
        return res.status(400).json({ message: "Model belum dilatih." });
    }
    const transaction = await db.sequelize.transaction();
    try {
        const batchName = `Pengujian Model (Data Uji) - ${new Date().toLocaleString('id-ID')}`;
        const newBatch = await SelectionBatch.create({
            namaBatch: batchName,
            userId: req.user.id,
            catatan: `Model diuji dengan ${testingDataIds.length} data uji.`
        }, { transaction });

        await SelectionResult.destroy({ where: {}, truncate: true, transaction });
        const testingData = await Applicant.findAll({ where: { id: testingDataIds }, transaction });

        // Menggunakan label 'terima' dan 'tidak' sesuai dengan isi database Anda
        const matrix = { 'terima': { 'terima': 0, 'tidak': 0 }, 'tidak': { 'terima': 0, 'tidak': 0 } };
        const resultsToSave = [];

        for (const applicant of testingData) {
            const plainApplicant = applicant.toJSON();
            // Normalisasi label ke huruf kecil
            const actualStatus = plainApplicant.statusBeasiswa.toLowerCase(); // "terima"/"tidak"
            let { decision: predictedStatus, path } = predict(trainedModel, plainApplicant);
            predictedStatus = predictedStatus.toLowerCase();

            let reason = 'Keputusan berdasarkan aturan mayoritas pada node daun.';
            const lastRule = path.filter(p => p.attribute).pop();
            if (lastRule) {
                const humanAttribute = lastRule.attribute.replace('_kategori', '');
                let condition = lastRule.threshold != null ? `${humanAttribute} ${plainApplicant[lastRule.attribute] <= lastRule.threshold ? '<=' : '>'} ${lastRule.threshold.toFixed(2)}` : `${humanAttribute} = '${lastRule.value}'`;
                reason = `${predictedStatus} karena memenuhi kondisi: ${condition}`;
            }

            if (matrix[actualStatus] && matrix[actualStatus][predictedStatus] !== undefined) {
                 matrix[actualStatus][predictedStatus]++;
            }

            resultsToSave.push({
                applicantId: plainApplicant.id,
                namaPendaftar: plainApplicant.nama,
                ipk: plainApplicant.ipk,
                penghasilanOrtu: plainApplicant.penghasilanOrtu,
                jmlTanggungan: plainApplicant.jmlTanggungan,
                ikutOrganisasi: plainApplicant.ikutOrganisasi,
                ikutUKM: plainApplicant.ikutUKM,
                statusKelulusan: predictedStatus === 'terima' ? 'Terima' : 'Tidak', // mapping ke format database
                alasanKeputusan: reason,
                batchId: newBatch.id,
                tanggalSeleksi: new Date(),
            });
        }
        
        await SelectionResult.bulkCreate(resultsToSave, { transaction });
        
        const TP = matrix['terima']['terima'];
        const TN = matrix['tidak']['tidak'];
        const total = testingData.length;
        const accuracy = total > 0 ? ((TP + TN) / total) * 100 : 0;
        
        await newBatch.update({ akurasi: accuracy }, { transaction });
        await transaction.commit();

        const FP = matrix['tidak']['terima'];
        const FN = matrix['terima']['tidak'];
        const precision = (TP + FP) > 0 ? (TP / (TP + FP)) * 100 : 0;
        const recall = (TP + FN) > 0 ? (TP / (TP + FN)) * 100 : 0;
        const f1score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

        res.status(200).json({
            message: "Pengujian model berhasil.",
            evaluation: {
                accuracy: accuracy.toFixed(2), precision: precision.toFixed(2), recall: recall.toFixed(2),
                f1score: f1score.toFixed(2), confusionMatrix: matrix, totalTestData: total
            }
        });
    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error("Error saat menguji model:", error);
        res.status(500).json({ message: "Gagal menguji model.", error: error.message });
    }
};

// Fungsi untuk menerapkan model ke semua data
exports.testModelOnAllData = async (req, res) => {
    if (!trainedModel) { return res.status(400).json({ message: "Model belum dilatih." }); }
    const transaction = await db.sequelize.transaction();
    try {
        const allApplicants = await Applicant.findAll({ transaction });
        if (allApplicants.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Tidak ada data pendaftar untuk diuji.' });
        }
        const batchName = `Aplikasi Global - ${new Date().toLocaleString('id-ID')}`;
        const newBatch = await SelectionBatch.create({
            namaBatch: batchName, userId: req.user.id,
            catatan: `Model diterapkan pada seluruh ${allApplicants.length} data.`
        }, { transaction });
        
        await SelectionResult.destroy({ where: {}, truncate: true, transaction });
        const resultsToSave = [];

        // Tambahkan confusion matrix & evaluasi
        const matrix = { 'terima': { 'terima': 0, 'tidak': 0 }, 'tidak': { 'terima': 0, 'tidak': 0 } };

        for (const applicant of allApplicants) {
            const plainApplicant = applicant.toJSON();
            // Normalisasi label ke huruf kecil
            const actualStatus = plainApplicant.statusBeasiswa.toLowerCase();
            let { decision: predictedStatus, path } = predict(trainedModel, plainApplicant);
            predictedStatus = predictedStatus.toLowerCase();

            let reason = 'Keputusan berdasarkan aturan mayoritas.';
            const lastRule = path.filter(p => p.attribute).pop();
            if (lastRule) {
                const humanAttribute = lastRule.attribute.replace('_kategori', '');
                let condition = lastRule.threshold != null ? `${humanAttribute} ${plainApplicant[lastRule.attribute] <= lastRule.threshold ? '<=' : '>'} ${lastRule.threshold.toFixed(2)}` : `${humanAttribute} = '${lastRule.value}'`;
                reason = `${predictedStatus} karena memenuhi kondisi: ${condition}`;
            }

            // Update confusion matrix
            if (matrix[actualStatus] && matrix[actualStatus][predictedStatus] !== undefined) {
                matrix[actualStatus][predictedStatus]++;
            }

            resultsToSave.push({
                applicantId: plainApplicant.id,
                namaPendaftar: plainApplicant.nama,
                ipk: plainApplicant.ipk,
                penghasilanOrtu: plainApplicant.penghasilanOrtu,
                jmlTanggungan: plainApplicant.jmlTanggungan,
                ikutOrganisasi: plainApplicant.ikutOrganisasi,
                ikutUKM: plainApplicant.ikutUKM,
                statusKelulusan: predictedStatus === 'terima' ? 'Terima' : 'Tidak', // mapping ke format database
                alasanKeputusan: reason,
                batchId: newBatch.id,
                tanggalSeleksi: new Date(),
            });
        }
        await SelectionResult.bulkCreate(resultsToSave, { transaction });

        // Hitung evaluasi
        const TP = matrix['terima']['terima'];
        const TN = matrix['tidak']['tidak'];
        const total = allApplicants.length;
        const accuracy = total > 0 ? ((TP + TN) / total) * 100 : 0;

        await newBatch.update({ akurasi: accuracy }, { transaction });
        await transaction.commit();

        const FP = matrix['tidak']['terima'];
        const FN = matrix['terima']['tidak'];
        const precision = (TP + FP) > 0 ? (TP / (TP + FP)) * 100 : 0;
        const recall = (TP + FN) > 0 ? (TP / (TP + FN)) * 100 : 0;
        const f1score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

        res.status(200).json({
            message: "Model berhasil diterapkan pada seluruh data.",
            evaluation: {
                accuracy: accuracy.toFixed(2), precision: precision.toFixed(2), recall: recall.toFixed(2),
                f1score: f1score.toFixed(2), confusionMatrix: matrix, totalTestData: total
            }
        });
    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error("Error saat menguji semua data:", error);
        res.status(500).json({ message: "Gagal menerapkan model ke seluruh data.", error: error.message });
    }
};

// Fungsi untuk visualisasi pohon
exports.getTreeVisualization = async (req, res) => {
    if (!trainedModel) {
        return res.status(400).json({ message: "Model belum dilatih." });
    }
    try {
        const treeVisualization = visualizeTree(trainedModel);
        res.status(200).json({
            tree: trainedModel,
            visualization: treeVisualization,
            steps: calculationSteps
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat visualisasi pohon.", error: error.message });
    }
};

// Fungsi untuk prediksi tunggal
exports.predictSingle = async (req, res) => {
    if (!trainedModel) {
        return res.status(400).json({ message: "Model belum dilatih." });
    }
    try {
        const { decision, path } = predict(trainedModel, req.body);
        res.status(200).json({ decision, path });
    } catch (error) {
        res.status(500).json({ message: "Gagal melakukan prediksi.", error: error.message });
    }
};