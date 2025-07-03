const NUMERIC_ATTRIBUTES = ['ipk', 'jmlTanggungan'];

const calculateEntropy = (data) => {
    if (data.length === 0) return 0;
    const classCounts = data.reduce((counts, item) => {
        const aClass = item.statusKelulusan;
        counts[aClass] = (counts[aClass] || 0) + 1;
        return counts;
    }, {});

    let entropy = 0;
    const totalSize = data.length;
    for (const aClass in classCounts) {
        const probability = classCounts[aClass] / totalSize;
        if (probability > 0) {
            entropy -= probability * Math.log2(probability);
        }
    }
    return entropy;
};

const splitData = (data, attribute, value) => {
    return data.filter(item => item[attribute] === value);
};

const calculateGainRatioForCategorical = (data, attribute, totalEntropy) => {
    const totalSize = data.length;
    const uniqueValues = [...new Set(data.map(item => item[attribute]))];
    let newEntropy = 0;
    let splitInfo = 0;

    for (const value of uniqueValues) {
        const subset = splitData(data, attribute, value);
        const subsetSize = subset.length;
        const probability = subsetSize / totalSize;

        if (probability > 0) {
            newEntropy += probability * calculateEntropy(subset);
            splitInfo -= probability * Math.log2(probability);
        }
    }

    const informationGain = totalEntropy - newEntropy;
    const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;
    
    return { gainRatio, informationGain, splitInfo };
};

const calculateGainRatioForContinuous = (data, attribute, totalEntropy) => {
    const totalSize = data.length;
    const sortedUniqueValues = [...new Set(data.map(item => item[attribute]))].sort((a, b) => a - b);
    
    let bestGainRatio = -1;
    let bestThreshold = null;
    let potentialThresholds = [];

    for (let i = 0; i < sortedUniqueValues.length - 1; i++) {
        potentialThresholds.push((sortedUniqueValues[i] + sortedUniqueValues[i + 1]) / 2);
    }
    if (potentialThresholds.length === 0 && sortedUniqueValues.length > 0) {
        potentialThresholds.push(sortedUniqueValues[0]);
    }

    for (const threshold of potentialThresholds) {
        const lessThanOrEqualData = data.filter(item => item[attribute] <= threshold);
        const greaterThanData = data.filter(item => item[attribute] > threshold);

        if (lessThanOrEqualData.length === 0 || greaterThanData.length === 0) {
            continue;
        }

        const pLess = lessThanOrEqualData.length / totalSize;
        const pGreater = greaterThanData.length / totalSize;

        const newEntropy = (pLess * calculateEntropy(lessThanOrEqualData)) + (pGreater * calculateEntropy(greaterThanData));
        const informationGain = totalEntropy - newEntropy;
        const splitInfo = -(pLess * Math.log2(pLess)) - (pGreater * Math.log2(pGreater));
        const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;

        if (gainRatio > bestGainRatio) {
            bestGainRatio = gainRatio;
            bestThreshold = threshold;
        }
    }

    return { gainRatio: bestGainRatio, threshold: bestThreshold };
};

const findBestAttribute = (data, attributes) => {
    const totalEntropy = calculateEntropy(data);
    let bestAttribute = null;
    let bestGainRatio = -1;
    let bestThreshold = null;
    const calculations = {};

    for (const attribute of attributes) {
        let result;
        if (NUMERIC_ATTRIBUTES.includes(attribute)) {
            result = calculateGainRatioForContinuous(data, attribute, totalEntropy);
            calculations[attribute] = { gainRatio: result.gainRatio, threshold: result.threshold };
        } else {
            result = calculateGainRatioForCategorical(data, attribute, totalEntropy);
            calculations[attribute] = { gainRatio: result.gainRatio };
        }

        if (result.gainRatio > bestGainRatio) {
            bestGainRatio = result.gainRatio;
            bestAttribute = attribute;
            bestThreshold = result.threshold || null;
        }
    }

    return { bestAttribute, bestThreshold, calculations };
};

const buildTree = (data, attributes, defaultStatus = null, steps = []) => {
    const classCounts = data.reduce((counts, item) => {
        counts[item.statusKelulusan] = (counts[item.statusKelulusan] || 0) + 1;
        return counts;
    }, {});

    const majorityClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b, defaultStatus);

    if (data.length === 0 || attributes.length === 0) {
        return { isLeaf: true, decision: majorityClass, count: data.length, classCounts };
    }

    const uniqueClasses = new Set(data.map(item => item.statusKelulusan));
    if (uniqueClasses.size === 1) {
        return { isLeaf: true, decision: uniqueClasses.values().next().value, count: data.length, classCounts };
    }

    const { bestAttribute, bestThreshold, calculations } = findBestAttribute(data, attributes);
    
    steps.push({
        bestAttribute,
        dataSize: data.length,
        entropy: calculateEntropy(data),
        calculations
    });

    if (!bestAttribute || calculations[bestAttribute].gainRatio <= 0) {
        return { isLeaf: true, decision: majorityClass, count: data.length, classCounts };
    }

    const tree = {
        name: bestAttribute,
        threshold: bestThreshold,
        branches: {},
        count: data.length,
        classCounts
    };

    const remainingAttributes = attributes.filter(attr => attr !== bestAttribute);

    if (bestThreshold !== null) {
        const lessThanOrEqualData = data.filter(item => item[bestAttribute] <= bestThreshold);
        const greaterThanData = data.filter(item => item[bestAttribute] > bestThreshold);
        
        const branchLTE = `<= ${bestThreshold.toFixed(2)}`;
        const branchGT = `> ${bestThreshold.toFixed(2)}`;

        tree.branches[branchLTE] = buildTree(lessThanOrEqualData, remainingAttributes, majorityClass, steps);
        tree.branches[branchGT] = buildTree(greaterThanData, remainingAttributes, majorityClass, steps);
    } else {
        const uniqueValues = [...new Set(data.map(item => item[bestAttribute]))];
        for (const value of uniqueValues) {
            const subset = splitData(data, bestAttribute, value);
            tree.branches[value] = buildTree(subset, remainingAttributes, majorityClass, steps);
        }
    }

    return tree;
};

const predict = (tree, item) => {
    let currentNode = tree;
    const path = [];

    while (!currentNode.isLeaf) {
        const attribute = currentNode.name;
        const value = item[attribute];
        let branchName;

        if (currentNode.threshold !== null) {
            path.push({ attribute, value, threshold: currentNode.threshold });
            branchName = value <= currentNode.threshold ? `<= ${currentNode.threshold.toFixed(2)}` : `> ${currentNode.threshold.toFixed(2)}`;
        } else {
            path.push({ attribute, value });
            branchName = value;
        }
        
        if (currentNode.branches[branchName]) {
            currentNode = currentNode.branches[branchName];
        } else {
            const allDecisions = Object.values(currentNode.branches).map(b => b.decision).filter(Boolean);
            const decisionCounts = allDecisions.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {});
            const majorityDecision = Object.keys(decisionCounts).reduce((a, b) => decisionCounts[a] > decisionCounts[b] ? a : b, 'Tidak Direkomendasikan');
            return { decision: majorityDecision, path };
        }
    }

    path.push({ decision: currentNode.decision });
    return { decision: currentNode.decision, path };
};

const visualizeTree = (tree, prefix = '') => {
    if (tree.isLeaf) {
        return `--> ${tree.decision}\n`;
    }

    let output = '';
    const branches = Object.keys(tree.branches);

    branches.forEach((branch, index) => {
        const isLast = index === branches.length - 1;
        const connector = isLast ? '└──' : '├──';
        
        let condition = '';
        if (tree.threshold !== null) {
            condition = `${tree.name} ${branch}`;
        } else {
            condition = `${tree.name} = ${branch}`;
        }

        output += `${prefix}${connector} ${condition}\n`;
        
        const newPrefix = prefix + (isLast ? '    ' : '|   ');
        output += visualizeTree(tree.branches[branch], newPrefix);
    });

    return output;
};

module.exports = {
    buildTree,
    predict,
    visualizeTree
};
