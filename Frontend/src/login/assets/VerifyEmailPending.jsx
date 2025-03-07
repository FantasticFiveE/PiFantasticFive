function VerifyEmailPending() {
  return (
    <div>
      <h2>Verification Pending</h2>
      <p>A confirmation email has been sent. Please check your inbox.</p>
      <button onClick={() => navigate("/login")}>Log In</button>
    </div>
  );
}

export default VerifyEmailPending;
