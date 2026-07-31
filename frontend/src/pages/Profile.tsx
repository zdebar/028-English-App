import PropertyView from '@/components/UI/PropertyView';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
 */
export default function Profile(): JSX.Element {
  const userEmail = useAuthStore((state) => state.userEmail);

  return (
    <div className="card-width grow-0 gap-1">
      <div className="mx-auto mt-6 mb-4 w-64 text-left">
        <PropertyView
          label={TEXTS.profileEmailLabel}
          className="justify-center"
          classNameLabel="w-20"
          classNameValue="wrap-break-word"
        >
          {userEmail || TEXTS.notAvailable}
        </PropertyView>
      </div>
      <SignoutButton />
      <DeleteUserButton />
    </div>
  );
}
