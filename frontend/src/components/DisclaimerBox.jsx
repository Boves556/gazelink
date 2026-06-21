import './DisclaimerBox.css';

const FULL_TEXT =
  'GazeLink is a university prototype for educational purposes only. It is not a medical device, does not diagnose ADHD, and must not be used for clinical decision-making without proper validation, ethical approval, and regulatory clearance.';

export default function DisclaimerBox({ compact = false }) {
  if (compact) {
    return <p className="disclaimer-box compact">{FULL_TEXT}</p>;
  }

  return (
    <div className="disclaimer-box">
      <strong>Important — not a diagnostic tool</strong>
      <p>{FULL_TEXT}</p>
    </div>
  );
}
