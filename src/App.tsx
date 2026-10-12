import { BackgroundMusic } from './components/layout/BackgroundMusic';
import { PayrollPage } from './pages/PayrollPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { MAINTENANCE_MODE } from './constants/maintenance';
import { SupportReportButton } from './components/layout/SupportReportButton';

export default function App() {
  return (
    <>
      {MAINTENANCE_MODE ? <MaintenancePage /> : <><BackgroundMusic /><PayrollPage /></>}
      <SupportReportButton formName="Form Calon Karyawan" />
    </>
  );
}
