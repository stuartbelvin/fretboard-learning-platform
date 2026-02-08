import { useNavigate } from 'react-router-dom';
import { SettingsPanel } from '../components/settings';

/**
 * SettingsPage - Application settings page
 * 
 * Provides access to all application settings including
 * colors, quiz preferences, viewport, and instrument settings.
 */
export function SettingsPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <main className="app-main settings-view">
      <SettingsPanel 
        sections={['all']}
        onClose={handleClose}
      />
    </main>
  );
}
