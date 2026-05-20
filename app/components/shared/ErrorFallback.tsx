"use client";

type ErrorFallbackProps = {
  error?: Error & { digest?: string };
  message: string;
  onRetry?: () => void;
  showReload?: boolean;
  title?: string;
};

export function ErrorFallback({
  error,
  message,
  onRetry,
  showReload = false,
  title = "Something went wrong",
}: ErrorFallbackProps) {
  const showDetails =
    process.env.NODE_ENV === "development" && Boolean(error?.message);

  return (
    <div className="error-fallback" role="alert">
      <p className="error-fallback-eyebrow font-control">Playlistly</p>
      <h1 className="error-fallback-title font-logo">{title}</h1>
      <p className="error-fallback-message font-control">{message}</p>

      <div className="error-fallback-actions">
        {onRetry ? (
          <button className="toolbar-button" onClick={onRetry} type="button">
            Try again
          </button>
        ) : null}
        {showReload ? (
          <button
            className="toolbar-button"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload page
          </button>
        ) : null}
      </div>

      {showDetails ? (
        <details className="error-fallback-details">
          <summary className="font-control">Error details</summary>
          <pre className="error-fallback-details-body">{error?.message}</pre>
          {error?.digest ? (
            <p className="error-fallback-digest font-control">
              Digest: {error.digest}
            </p>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
