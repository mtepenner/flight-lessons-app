function Toast({ message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <aside className="toast" role="alert">
      <p>{message}</p>
      <button className="secondary-button" onClick={onDismiss} type="button">
        Dismiss
      </button>
    </aside>
  );
}

export default Toast;