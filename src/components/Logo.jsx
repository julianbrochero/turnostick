export default function Logo({ size = 32, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="turnoStick"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}
