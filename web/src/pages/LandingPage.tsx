import { useNavigate } from 'react-router-dom'
import { LandingScreen } from '@/components/LandingScreen'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <LandingScreen
      onSolveManually={() => navigate('/app')}
      onUploadScreenshot={() => navigate('/app?upload=1')}
    />
  )
}
