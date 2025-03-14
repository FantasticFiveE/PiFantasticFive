function VerifyEmailPending() {
    return (
      <div>
        <h2>Vérification en attente</h2>
        <p>Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte mail.</p>
        <button onClick={() => navigate("/login")}>Se connecter</button>
      </div>
    );
  }
  export default VerifyEmailPending;
  