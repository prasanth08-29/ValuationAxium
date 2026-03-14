const fs = require('fs');

async function testRender() {
    console.log("Starting test...");
    
    // Read the template
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/axium_valuation');
    const Template = mongoose.model('Template', new mongoose.Schema({ name: String, entity: String, fields: Array }));
    
    const t = await Template.findOne({name: /individual/i});
    if (!t) {
        console.log("Template not found");
        process.exit(1);
    }
    
    const fields = t.fields;
    
    // Simulate the exact mapping done in ValuationForm.jsx
    let crashed = false;
    fields.forEach((field, i) => {
        try {
            const isCheckboxFallback = field.type === 'radio' && (!field.options || (Array.isArray(field.options) ? field.options.filter(o => o.trim()).length === 0 : !field.options.trim()));
            const hideLeftLabel = isCheckboxFallback || field.type === 'heading' || field.type === 'subheading';
            
            // simulate rendering options
            if (field.type === 'radio') {
                if (!isCheckboxFallback) {
                    const opts = (Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()) : [])).filter(o => o && o.trim());
                    opts.map(opt => {
                        // simulate map
                    });
                }
            } else if (field.type === 'checkboxes') {
                const opts = (Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()) : [])).filter(o => o && o.trim());
                opts.map(opt => {
                    // simulate map
                });
            }
        } catch (err) {
            console.error(`Crash on field[${i}] "${field.label}":`, err.message);
            crashed = true;
        }
    });
    
    // Simulate computeEffectiveTemplate
    try {
        const baseTemplate = { sections: [{ fields }] };
        const currentValues = {};
        
        baseTemplate.sections.map(sec => {
            let finalFields = [];
            let currentGroup = null;

            const flushGroup = () => {
                if (!currentGroup) return;
                const parentVal = currentValues[currentGroup.parentId];
                
                if (Array.isArray(parentVal) && parentVal.length > 0) {
                    const allowedStr = currentGroup.allowValue || '';
                    const allowedVals = allowedStr ? allowedStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : null;
                    
                    const sortedVals = [...parentVal]
                        .filter(v => {
                            if (!allowedVals || allowedVals.length === 0) return true;
                            return allowedVals.includes(String(v).trim().toLowerCase());
                        })
                        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

                    if (sortedVals.length > 0) {
                        sortedVals.forEach(val => {
                            const suffix = `_rep_${String(val).replace(/[^a-zA-Z0-9]/g, '')}`;
                            const labelSuffix = ` (${val})`;
                            currentGroup.fields.forEach(field => {
                                const clonedField = { ...field };
                                clonedField.id = `${field.id}${suffix}`;
                                clonedField.label = `${field.label}${labelSuffix}`;
                                
                                const rules = field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue || '' }] : []);
                                const validRules = rules.filter(c => c.fieldId);
                                
                                clonedField.conditions = [{
                                    fieldId: validRules[0].fieldId,
                                    value: String(val)
                                }];
                                clonedField.dependsOn = undefined;
                                clonedField.dependsOnValue = undefined;
                                finalFields.push(clonedField);
                            });
                        });
                    } else {
                        currentGroup.fields.forEach(field => finalFields.push(field));
                    }
                } else {
                    currentGroup.fields.forEach(field => finalFields.push(field));
                }
                currentGroup = null;
            };

            sec.fields?.forEach(field => {
                const rules = field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue || '' }] : []);
                const validRules = rules.filter(c => c.fieldId);

                if (validRules.length === 1) {
                    const parentId = validRules[0].fieldId;
                    const valueStr = String(validRules[0].value || '').trim();
                    
                    if (currentGroup && currentGroup.parentId === parentId && currentGroup.allowValue === valueStr) {
                        currentGroup.fields.push(field);
                    } else {
                        flushGroup();
                        currentGroup = { parentId, allowValue: valueStr, fields: [field] };
                    }
                } else {
                    flushGroup();
                    finalFields.push(field);
                }
            });
            flushGroup();
            return { ...sec, fields: finalFields };
        });
    } catch (err) {
        console.error("Crash in computeEffectiveTemplate:", err);
        crashed = true;
    }
    
    if (!crashed) console.log("No crash detected statically.");
    process.exit(0);
}

testRender();
