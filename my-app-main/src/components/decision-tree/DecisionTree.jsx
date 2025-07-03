import React, { useEffect, useRef } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Card } from 'react-bootstrap';
import styled from 'styled-components';

const TreeContainer = styled.div`
    transform-origin: 0 0;
    transition: transform 0.3s ease;
`;

const StyledNode = ({ node }) => {
    const isLeaf = node.isLeaf || (!node.branches && !node.children);
    const decision = node.decision || node.name; // fallback to name if decision missing
    const attribute = node.name || node.attribute;
    const count = node.count || 0;

    const bgColor = isLeaf
        ? (decision?.toLowerCase() === 'terima' || decision?.toLowerCase() === 'direkomendasikan' ? 'success' : 'danger')
        : 'info';

    const borderColor = isLeaf
        ? (decision?.toLowerCase() === 'terima' || decision?.toLowerCase() === 'direkomendasikan' ? '#198754' : '#dc3545')
        : '#0dcaf0';

    return (
        <Card
            bg={bgColor}
            text={isLeaf ? 'white' : 'dark'}
            className="shadow-sm p-2 text-center tree-node-custom"
            style={{
                minWidth: 200,
                minHeight: 60,
                display: 'inline-block',
                border: `3px solid ${borderColor}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                fontSize: '1.1rem',
                cursor: 'pointer',
            }}
        >
            <Card.Title className="h6 mb-1" style={{ fontSize: '1.1rem' }}>
                {isLeaf ? (
                    <strong>
                        {decision}
                        <span style={{ fontSize: '0.9em', fontWeight: 400, marginLeft: 8 }}>
                            ({count} data)
                        </span>
                    </strong>
                ) : (
                    <strong>{attribute?.replace('_kategori', '')}</strong>
                )}
            </Card.Title>
            {!isLeaf && node.threshold != null && (
                <Card.Text className="mb-0 fst-italic" style={{ fontSize: '0.95rem' }}>
                    {`Threshold: ${node.threshold}`}
                </Card.Text>
            )}
        </Card>
    );
};


const renderTree = (node) => {
    if (!node) return null;
    const label = <StyledNode node={node} />;
    const children = node.branches || node.children;
    if (node.isLeaf || !children || typeof children !== 'object') return <TreeNode label={label} />;
    return (
        <TreeNode label={label}>
            {Object.entries(children).map(([key, childNode]) => (
                <TreeNode
                    key={key}
                    label={
                        <div
                            className="text-muted fst-italic"
                            style={{
                                fontSize: '1rem',
                                background: '#e9ecef',
                                borderRadius: 12,
                                padding: '4px 14px',
                                border: '1.5px solid #adb5bd',
                                margin: 6,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                fontWeight: 500,
                                letterSpacing: 0.5,
                            }}
                        >
                            {key}
                        </div>
                    }
                >
                    {renderTree(childNode)}
                </TreeNode>
            ))}
        </TreeNode>
    );
};


const DecisionTree = ({ data }) => {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (!containerRef.current) return;
        
        let scale = 1;
        const container = containerRef.current;
        
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.5, scale + delta), 2);
            scale = newScale;
            container.style.transform = `scale(${scale})`;
        };
        
        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (!data) return null;

    const children = data.branches || data.children;

    return (
        <TreeContainer ref={containerRef}>
            <Tree
                lineWidth={'2px'}
                lineColor={'#0dcaf0'}
                lineBorderRadius={'10px'}
                label={<StyledNode node={data} />}
            >
                {children && typeof children === 'object'
                    ? Object.entries(children).map(([key, childNode]) => (
                        <TreeNode
                            key={key}
                            label={
                                <div
                                    className="text-muted fst-italic"
                                    style={{
                                        fontSize: '1rem',
                                        background: '#e9ecef',
                                        borderRadius: 12,
                                        padding: '4px 14px',
                                        border: '1.5px solid #adb5bd',
                                        margin: 6,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        fontWeight: 500,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {key}
                                </div>
                            }
                        >
                            {renderTree(childNode)}
                        </TreeNode>
                    ))
                    : null}
            </Tree>
        </TreeContainer>
    );
};


export default DecisionTree;
