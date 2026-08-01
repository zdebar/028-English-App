import Notification from '@/components/UI/Notification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { TEXTS } from '@/locales/cs';

export default function RouteDataError() {
  return (
    <div className="card-width w-full pt-24">
      <Notification className="color-info mb-4">{TEXTS.loadingError}</Notification>
      <ReturnHomeButton />
    </div>
  );
}
