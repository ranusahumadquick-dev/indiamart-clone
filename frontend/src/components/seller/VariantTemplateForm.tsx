import { useState } from "react";
import {
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlineExclamationTriangle,
} from "@/lib/icons";
import {
  VariantTemplate,
  getVariantCombinationCount,
  validateVariantTemplates,
} from "@/utils/variantGenerator";

interface VariantTemplateFormProps {
  templates: VariantTemplate[];
  onChange: (templates: VariantTemplate[]) => void;
  disabled?: boolean;
}

export default function VariantTemplateForm({
  templates,
  onChange,
  disabled = false,
}: VariantTemplateFormProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const addTemplate = () => {
    const newTemplates = [
      ...templates,
      { name: "", values: [""] },
    ];
    onChange(newTemplates);
    setErrors([]);
  };

  const removeTemplate = (idx: number) => {
    const newTemplates = templates.filter((_, i) => i !== idx);
    onChange(newTemplates);
    validateForm(newTemplates);
  };

  const updateTemplateName = (idx: number, name: string) => {
    const newTemplates = templates.map((t, i) =>
      i === idx ? { ...t, name } : t
    );
    onChange(newTemplates);
    validateForm(newTemplates);
  };

  const addValue = (idx: number) => {
    const newTemplates = templates.map((t, i) =>
      i === idx ? { ...t, values: [...t.values, ""] } : t
    );
    onChange(newTemplates);
  };

  const removeValue = (templateIdx: number, valueIdx: number) => {
    const newTemplates = templates.map((t, i) =>
      i === templateIdx
        ? { ...t, values: t.values.filter((_, vi) => vi !== valueIdx) }
        : t
    );
    onChange(newTemplates);
    validateForm(newTemplates);
  };

  const updateValue = (
    templateIdx: number,
    valueIdx: number,
    value: string
  ) => {
    const newTemplates = templates.map((t, i) =>
      i === templateIdx
        ? {
            ...t,
            values: t.values.map((v, vi) => (vi === valueIdx ? value : v)),
          }
        : t
    );
    onChange(newTemplates);
    validateForm(newTemplates);
  };

  const validateForm = (templs: VariantTemplate[]) => {
    const result = validateVariantTemplates(templs);
    setErrors(result.errors);
  };

  const combinationCount = getVariantCombinationCount(templates);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="label-sm">Product Variants</label>
          <p className="text-xs text-gray-500 mt-1">
            Create variant combinations (e.g., Color × Size)
          </p>
        </div>
        {combinationCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-blue-700">
            {combinationCount.toLocaleString()} combinations
          </div>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex gap-2 text-sm text-red-700">
              <HiOutlineExclamationTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Variant templates */}
      <div className="space-y-4">
        {templates.map((template, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
          >
            {/* Template name */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Variant Type {idx + 1}
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) =>
                    updateTemplateName(idx, e.target.value)
                  }
                  placeholder="e.g., Color, Size, Flavor"
                  className="input-base mt-1"
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                onClick={() => removeTemplate(idx)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition mt-6"
                disabled={disabled}
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            </div>

            {/* Template values */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Options
              </label>
              <div className="space-y-2">
                {template.values.map((value, valIdx) => (
                  <div key={valIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        updateValue(idx, valIdx, e.target.value)
                      }
                      placeholder={`Option ${valIdx + 1}`}
                      className="input-base"
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      onClick={() => removeValue(idx, valIdx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      disabled={disabled || template.values.length === 1}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add value button */}
              <button
                type="button"
                onClick={() => addValue(idx)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                disabled={disabled}
              >
                <HiOutlinePlusCircle className="w-4 h-4" />
                Add Option
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add template button */}
      <button
        type="button"
        onClick={addTemplate}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 font-medium transition w-full justify-center"
        disabled={disabled}
      >
        <HiOutlinePlusCircle className="w-5 h-5" />
        Add Variant Type
      </button>

      {/* Info message */}
      {templates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          {combinationCount} variant combinations will be created from {templates.length} variant type(s).
        </div>
      )}
    </div>
  );
}
