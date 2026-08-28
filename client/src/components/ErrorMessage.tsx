export default function ErrorMessage({ message }: { message?: string }) {
  return <p className="error-text">{message}</p>
}
