const REASON_LABELS: Record<string, string> = {
  missing_params: 'Discord did not send back the expected authorization code.',
  missing_env: 'Server misconfiguration (missing Discord app credentials).',
  token_exchange_failed: 'Discord rejected the token exchange (check server logs for the exact reason).',
  user_fetch_failed: 'Could not fetch your Discord profile after authorization.',
}

export default async function VerifyErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const detail = reason ? REASON_LABELS[reason] ?? null : null

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verification failed</h1>
        <p style={{ color: '#aaa' }}>An error occurred. Go back to Discord and try again.</p>
        {detail && (
          <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
