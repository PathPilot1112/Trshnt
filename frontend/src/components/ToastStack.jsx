import React from 'react';

const typeStyles = {
  success: { accent: '#39FF14', bg: 'rgba(8, 20, 22, 0.96)' },
  error: { accent: '#ff4d4d', bg: 'rgba(22, 8, 8, 0.96)' },
  info: { accent: '#9BA8A8', bg: 'rgba(8, 20, 22, 0.96)' },
};

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts?.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const style = typeStyles[toast.type] || typeStyles.info;
        return (
          <button
            key={toast.id}
            type="button"
            className="toast-card"
            onClick={() => onDismiss(toast.id)}
            style={{
              borderColor: style.accent,
              background: style.bg,
              boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 0 0.5px ${style.accent}55`,
            }}
          >
            <span className="toast-bar" style={{ background: style.accent }} />
            <span className="toast-body">
              <span className="toast-title">{toast.title}</span>
              {toast.message && <span className="toast-message">{toast.message}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ToastStack;
