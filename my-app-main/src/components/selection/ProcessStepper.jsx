import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { CheckCircleFill, Circle, ArrowRight } from 'react-bootstrap-icons';

const ProcessStepper = ({ currentStep, steps }) => {
    return (
        <Row className="justify-content-center mb-4">
            <Col xs={12} className="position-relative">
                <div className="d-flex justify-content-between align-items-center">
                    {steps.map((step, index) => (
                        <div key={index} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                            <div className="d-flex align-items-center w-100">
                                <div className={`rounded-circle p-2 ${currentStep >= index ? 'bg-primary' : 'bg-secondary'}`}>
                                    {currentStep > index ? (
                                        <CheckCircleFill className="text-white" size={24} />
                                    ) : currentStep === index ? (
                                        <Circle className="text-white" size={24} />
                                    ) : (
                                        <Circle className="text-white opacity-50" size={24} />
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="w-100 border-top border-2 mx-2"></div>
                                )}
                            </div>
                            <span className={`mt-2 text-center ${currentStep >= index ? 'text-primary' : 'text-secondary'}`}>
                                {step}
                            </span>
                        </div>
                    ))}
                </div>
            </Col>
        </Row>
    );
};

export default ProcessStepper;
