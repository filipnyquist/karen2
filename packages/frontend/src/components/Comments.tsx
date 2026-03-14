import { useState, useEffect } from "react";
import { eden } from "../eden";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, Send, Trash2, Edit2, X, Check } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

interface CommentsProps {
  eventId: string;
}

export function Comments({ eventId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  async function fetchComments() {
    setIsLoading(true);
    const { data } = await eden.events[eventId].comments.get();
    if (data) {
      setComments(data.comments || []);
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await eden.events[eventId].comments.post({
      content: newComment,
    });

    if (!error) {
      setNewComment("");
      fetchComments();
    }
    setIsSubmitting(false);
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return;

    const { error } = await eden.events[eventId].comments[commentId].put({
      content: editContent,
    });

    if (!error) {
      setEditingComment(null);
      fetchComments();
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await eden.events[eventId].comments[commentId].delete();

    if (!error) {
      fetchComments();
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function startEditing(comment: Comment) {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  }

  function cancelEditing() {
    setEditingComment(null);
    setEditContent("");
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title mb-4">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        {user && (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet</p>
            {user && <p className="text-sm mt-1">Be the first to comment!</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center font-bold flex-shrink-0">
                  {comment.user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="bg-base-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {formatDate(comment.createdAt)}
                        {comment.isEdited && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </span>
                    </div>

                    {editingComment === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          className="textarea textarea-bordered w-full textarea-sm"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleEdit(comment.id)}
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={cancelEditing}
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {user?.id === comment.user.id && editingComment !== comment.id && (
                    <div className="flex gap-2 mt-1 ml-1">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => startEditing(comment)}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
