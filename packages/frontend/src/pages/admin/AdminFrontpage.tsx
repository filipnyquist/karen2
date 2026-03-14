import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../../eden";
import {
  Settings,
  ChevronLeft,
  AlertCircle,
  Check,
  Eye,
  FileText,
} from "lucide-react";

interface Notice {
  id: string;
  title: string | null;
  content: string;
  isActive: boolean;
  updatedAt: string;
}

export function AdminFrontpage() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchNotice();
  }, []);

  async function fetchNotice() {
    setIsLoading(true);
    const { data } = await eden.admin.frontpage.get();
    if (data?.notice) {
      setNotice(data.notice);
      setTitle(data.notice.title || "");
      setContent(data.notice.content);
      setIsActive(data.notice.isActive);
    }
    setIsLoading(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: title || undefined,
      content,
      isActive,
    };

    const { error: apiError } = await eden.admin.frontpage.post(payload);

    if (apiError) {
      setError("Failed to save notice");
    } else {
      setSuccess("Notice saved successfully");
      fetchNotice();
    }

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="btn btn-ghost btn-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold">Front Page Notice</h1>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-6">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Settings className="w-5 h-5" />
              Edit Notice
            </h2>

            <div className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title (optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Welcome to Karen 2"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Content *</span>
                </label>
                <textarea
                  className="textarea textarea-bordered min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter notice content here..."
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Supports plain text and basic formatting
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="label-text">Show notice on front page</span>
                </label>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Notice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Eye className="w-5 h-5" />
              Preview
            </h2>

            <div className="mt-4">
              {isActive ? (
                <div className="alert alert-info">
                  <FileText className="w-5 h-5" />
                  <div>
                    {title && (
                      <h3 className="font-bold text-lg">{title}</h3>
                    )}
                    <div className="whitespace-pre-wrap">{content}</div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>
                    This notice is currently hidden. Enable "Show notice on
                    front page" to display it.
                  </span>
                </div>
              )}
            </div>

            {notice?.updatedAt && (
              <p className="text-sm text-base-content/70 mt-4">
                Last updated:{" "}
                {new Date(notice.updatedAt).toLocaleString("sv-SE")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
