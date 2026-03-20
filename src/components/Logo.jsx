export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fondo redondeado */}
      <rect width="48" height="48" rx="12" fill="#31393C" />

      {/* Cuerpo del calendario */}
      <rect x="9" y="16" width="30" height="23" rx="4" fill="#AAFF00" />

      {/* Cabecera del calendario */}
      <rect x="9" y="16" width="30" height="9" rx="4" fill="#88CC00" />
      <rect x="9" y="21" width="30" height="4" fill="#88CC00" />

      {/* Argollas */}
      <rect x="16" y="10" width="4" height="8" rx="2" fill="#AAFF00" />
      <rect x="28" y="10" width="4" height="8" rx="2" fill="#AAFF00" />

      {/* Check mark */}
      <path
        d="M18 31l4 4 8-8"
        stroke="#31393C"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
