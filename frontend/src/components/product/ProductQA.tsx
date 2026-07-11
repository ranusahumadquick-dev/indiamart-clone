"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineHandThumbUp,
  HiHandThumbUp,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineUser,
  HiChevronDown,
} from "react-icons/hi2";

interface QAItem {
  _id: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  askedBy: { _id: string; name: string; avatar?: string };
  answeredBy?: { _id: string; name: string; companyName?: string };
  upvotes: string[];
  createdAt: string;
}

interface ProductQAProps {
  productId: string;
  sellerId?: string;
}

export default function ProductQA({ productId, sellerId }: ProductQAProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const isSeller = user?._id === sellerId || user?.role === "seller";

  const fetchQuestions = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/questions/product/${productId}?page=${pg}&limit=5`);
      const d = res.data.data;
      if (pg === 1) setQuestions(d.questions || []);
      else setQuestions((prev) => [...prev, ...(d.questions || [])]);
      setTotal(d.total || 0);
      setPage(pg);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/questions/product/${productId}`, { question: questionText.trim() });
      setQuestions((prev) => [res.data.data, ...prev]);
      setTotal((t) => t + 1);
      setQuestionText("");
      toast.success("Question submitted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      const res = await api.put(`/questions/${questionId}/answer`, { answer: answerText.trim() });
      setQuestions((prev) => prev.map((q) => q._id === questionId ? res.data.data : q));
      setAnsweringId(null);
      setAnswerText("");
      toast.success("Answer posted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const upvote = async (questionId: string) => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    try {
      const res = await api.post(`/questions/${questionId}/upvote`);
      setQuestions((prev) =>
        prev.map((q) => {
          if (q._id !== questionId) return q;
          const uid = user!._id;
          return {
            ...q,
            upvotes: res.data.data.upvoted
              ? [...q.upvotes, uid]
              : q.upvotes.filter((id) => id !== uid),
          };
        })
      );
    } catch { /* silent */ }
  };

  const deleteQ = async (questionId: string) => {
    try {
      await api.delete(`/questions/${questionId}`);
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Question deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "today";
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <section id="questions" className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-[var(--primary)]" />
          Product Q&amp;A
          {total > 0 && <span className="text-sm font-normal text-gray-400">({total})</span>}
        </h2>
      </div>

      {/* Ask a question */}
      <form onSubmit={submitQuestion} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={isAuthenticated ? "Ask a question about this product..." : "Login to ask a question"}
            disabled={!isAuthenticated || submitting}
            maxLength={500}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || submitting || !questionText.trim()}
            className="px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? "Posting..." : "Ask"}
          </button>
        </div>
        {!isAuthenticated && (
          <p className="text-xs text-gray-400 mt-1.5">
            <button type="button" onClick={() => router.push("/auth/login")} className="text-[var(--primary)] hover:underline">Login</button> to ask questions
          </p>
        )}
      </form>

      {/* Loading */}
      {loading && page === 1 && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <HiOutlineChatBubbleLeftRight className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No questions yet. Be the first to ask!</p>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q) => {
          const upvoted = user ? q.upvotes.includes(user._id) : false;
          const isAsker = user?._id === q.askedBy?._id;
          const canDelete = isAsker || isSeller;

          return (
            <div key={q._id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Question */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    {q.askedBy?.avatar ? (
                      <img src={q.askedBy?.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <HiOutlineUser className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{q.askedBy?.name || "Anonymous"}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(q.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{q.question}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => upvote(q._id)}
                        className={`flex items-center gap-1 text-xs transition ${upvoted ? "text-blue-600 font-semibold" : "text-gray-400 hover:text-blue-500"}`}
                      >
                        {upvoted ? <HiHandThumbUp className="w-3.5 h-3.5" /> : <HiOutlineHandThumbUp className="w-3.5 h-3.5" />}
                        {q.upvotes.length > 0 ? q.upvotes.length : "Helpful"}
                      </button>
                      {isSeller && !q.answer && (
                        <button
                          onClick={() => { setAnsweringId(q._id); setAnswerText(""); }}
                          className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                          Answer
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deleteQ(q._id)} className="text-xs text-red-400 hover:text-red-600 hover:underline flex items-center gap-1">
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer */}
              {q.answer && (
                <div className="bg-green-50 border-t border-green-100 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-0.5">
                        {q.answeredBy?.companyName || q.answeredBy?.name || "Seller"} · {q.answeredAt ? timeAgo(q.answeredAt) : ""}
                      </p>
                      <p className="text-sm text-gray-700">{q.answer}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Answer input (seller) */}
              {answeringId === q._id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitAnswer(q._id)}
                      disabled={submittingAnswer || !answerText.trim()}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {submittingAnswer ? "Posting..." : "Post Answer"}
                    </button>
                    <button onClick={() => setAnsweringId(null)} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {questions.length < total && (
        <button
          onClick={() => fetchQuestions(page + 1)}
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--primary)] hover:underline disabled:opacity-50"
        >
          <HiChevronDown className="w-4 h-4" />
          {loading ? "Loading..." : `Show more questions (${total - questions.length} remaining)`}
        </button>
      )}
    </section>
  );
}
