/**
 * Admin Verify Doctors Page
 * Renders the client container for doctor approval
 */

import dynamic from 'next/dynamic';

const VerifyDoctorsContainer = dynamic(() => import('./VerifyDoctorsContainer'), { ssr: false });

export default function AdminVerifyDoctorsPage() {
  return <VerifyDoctorsContainer />;
}
