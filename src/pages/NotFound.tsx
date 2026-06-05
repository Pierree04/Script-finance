import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/misc';

export default function NotFound() {
  return (
    <EmptyState
      icon={<Compass size={32} />}
      title="Page introuvable"
      description="La page demandée n’existe pas."
      action={
        <Link to="/" className="btn-primary">
          Retour au tableau de bord
        </Link>
      }
    />
  );
}
