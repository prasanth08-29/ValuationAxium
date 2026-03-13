const currentValues = { "floors_required": ["1", "2"] };
const baseTemplate = {
  sections: [
    {
      fields: [
        { id: "name_of_the_floor", label: "Name of the Floor", dependsOn: "floors_required", dependsOnValue: "" },
        { id: "plinth_area", label: "Plinth Area", dependsOn: "floors_required", dependsOnValue: "" },
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
            console.log("Flushing group, parentId:", currentGroup.parentId, "parentVal:", parentVal);
            if (Array.isArray(parentVal) && parentVal.length > 0) {
                const sortedVals = [...parentVal].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
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
            currentGroup = null;
        };

        sec.fields?.forEach(field => {
            const rules = field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue || '' }] : []);
            const validRules = rules.filter(c => c.fieldId);

            if (validRules.length === 1 && !validRules[0].value) {
                const parentId = validRules[0].fieldId;
                if (currentGroup && currentGroup.parentId === parentId) {
                    currentGroup.fields.push(field);
                } else {
                    flushGroup();
                    currentGroup = { parentId, fields: [field] };
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

const result = computeEffectiveTemplate(baseTemplate, currentValues);
console.log(JSON.stringify(result, null, 2));

