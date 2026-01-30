import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonModal from '../modal/ButtonModal';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/config/texts.config';

/**
 * SignoutButton component for signing out the user.
 *
 * @param className - Optional CSS class name to apply to the button.
 */
export default function SignoutButton({ className }: { className?: string }) {
  const userId = useAuthStore((state) => state.userId);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const showToast = useToastStore((state) => state.showToast);

  const handleSignout = async () => {
    try {
      await handleLogout();
      showToast(TEXTS.signoutSuccessToast, 'success');
    } catch (error) {
      console.error('Error on user logout:', error);
      showToast(TEXTS.failureToast, 'error');
    }
  };

  return (
    <ButtonModal
      buttonText={TEXTS.signoutButtonTitle}
      disabled={!userId}
      modalDescription={TEXTS.signoutModalDescription}
      onConfirm={handleSignout}
      className={className}
    />
  );
}
