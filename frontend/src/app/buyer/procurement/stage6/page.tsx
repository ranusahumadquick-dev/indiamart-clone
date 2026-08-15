"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineBeaker,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineStar,
} from "@/lib/icons";

function Stage6SampleOrder() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "delivered" | "assessment">("pending");
  const [sampleOrders, setSampleOrders] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [assessment, setAssessment] = useState({
    passedQualityCheck: false,
    defectRate: 0,
    defectDescription: "",
    packagingOK: false,
    labelingOK: false,
    packagingNotes: "",
    rating: 0,
    notes: "",
  });

  const handleAssessmentSubmit = async () => {
    if (!selectedSample) return;

    try {
      setLoading(true);
      await api.post(`/sample-orders/${selectedSample._id}/assess`, assessment);
      toast.success("Assessment submitted!");
      setShowAssessmentForm(false);
      setSelectedSample(null);
    } catch (err) {
      toast.error("Failed to submit assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/buyer/procurement">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <HiOutlineArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stage 6: Sample Order</h1>
              <p className="text-sm text-gray-600">Request samples & perform quality assessment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: "pending", label: "📦 Pending Samples", icon: HiOutlineTruck },
            { id: "delivered", label: "✓ Delivered", icon: HiOutlineCheckCircle },
            { id: "assessment", label: "🔍 Assessment", icon: HiOutlineBeaker },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pending Samples */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                  <HiOutlineTruck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending samples</p>
                  <p className="text-sm text-gray-500 mt-1">Start negotiations in Stage 5</p>
                </div>
              </div>
            )}

            {/* Delivered Samples */}
            {activeTab === "delivered" && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="font-bold text-blue-900 mb-3">Sample 1: Cotton Fabric</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-800">
                      <strong>Supplier:</strong> ABC Textiles
                    </p>
                    <p className="text-blue-800">
                      <strong>Quantity:</strong> 10 units
                    </p>
                    <p className="text-blue-800">
                      <strong>Delivered:</strong> 25 May 2026
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSample({
                        _id: "sample1",
                        name: "Cotton Fabric",
                        supplier: "ABC Textiles",
                        quantity: 10,
                      });
                      setShowAssessmentForm(true);
                    }}
                    className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700"
                  >
                    Assess Quality
                  </button>
                </div>
              </div>
            )}

            {/* Assessment */}
            {activeTab === "assessment" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <HiOutlineCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">1 Assessment Completed</p>
                <p className="text-sm text-gray-500 mt-1">Rating: ⭐⭐⭐⭐⭐</p>
              </div>
            )}
          </div>

          {/* Assessment Form */}
          <div className="lg:col-span-2">
            {showAssessmentForm && selectedSample ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quality Assessment</h2>
                <p className="text-gray-600 mb-6">{selectedSample.name} from {selectedSample.supplier}</p>

                <div className="space-y-6">
                  {/* Quality Check */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assessment.passedQualityCheck}
                        onChange={(e) =>
                          setAssessment({ ...assessment, passedQualityCheck: e.target.checked })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-semibold text-gray-900">✓ Passed Quality Check</span>
                    </label>
                  </div>

                  {/* Defect Rate */}
                  {!assessment.passedQualityCheck && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Defect Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={assessment.defectRate}
                          onChange={(e) =>
                            setAssessment({ ...assessment, defectRate: parseInt(e.target.value) })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Defect Description</label>
                        <textarea
                          value={assessment.defectDescription}
                          onChange={(e) =>
                            setAssessment({ ...assessment, defectDescription: e.target.value })
                          }
                          placeholder="Describe the defects found..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                      </div>
                    </>
                  )}

                  {/* Packaging */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assessment.packagingOK}
                        onChange={(e) =>
                          setAssessment({ ...assessment, packagingOK: e.target.checked })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-semibold text-gray-900">✓ Packaging OK</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assessment.labelingOK}
                        onChange={(e) =>
                          setAssessment({ ...assessment, labelingOK: e.target.checked })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-semibold text-gray-900">✓ Labeling OK</span>
                    </label>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setAssessment({ ...assessment, rating: star })}
                          className={`text-3xl transition ${
                            assessment.rating >= star ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={assessment.notes}
                      onChange={(e) => setAssessment({ ...assessment, notes: e.target.value })}
                      placeholder="Additional comments..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={handleAssessmentSubmit}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      {loading ? "Submitting..." : "Submit Assessment"}
                    </button>
                    <button
                      onClick={() => setShowAssessmentForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <HiOutlineBeaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">Select a sample to assess</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stage6Page() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium"]}>
      <Stage6SampleOrder />
    </ProtectedRoute>
  );
}
