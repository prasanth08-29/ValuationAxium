const currentValues = { "floors": ["1", "2"] };
const baseTemplate = {
  sections: [
    {
      fields: [
        { id: "floor_name", label: "Floor Name", conditions: [{ fieldId: "floors", value: "1,2" }] },
        { id: "area", label: "Area", conditions: [{ fieldId: "floors", value: "1,2" }] }
      ]
    }
  ]
};

const computeEffectiveTemplate = (baseTemplate, currentValues) => {
    if (!baseTemplate || !baseTemplate.sections) return baseTemplate;
    const newSections = baseTemplate.sections.map(sec => {
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
    return { ...baseTemplate, sections: newSections };
};

console.log(JSON.stringify(computeEffectiveTemplate(baseTemplate, currentValues), null, 2));

