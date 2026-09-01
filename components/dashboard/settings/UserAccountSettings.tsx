'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { logout } from '@/frontend-services/auth.service';
import { deleteMe, updateMe } from '@/frontend-services/me.service';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

type UserAccountSettingsProps = {
  initialUser: {
    id: string;
    name: string;
    email: string;
  };
};

type AlertState = {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
};

export default function UserAccountSettings({
  initialUser,
}: UserAccountSettingsProps) {
  const router = useRouter();

  const [savedProfile, setSavedProfile] = useState({
    name: initialUser.name,
    email: initialUser.email,
  });
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [alert, setAlert] = useState<AlertState | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const hasChanges = useMemo(() => {
    return (
      trimmedName !== savedProfile.name || trimmedEmail !== savedProfile.email
    );
  }, [savedProfile.email, savedProfile.name, trimmedEmail, trimmedName]);

  function resetDraft() {
    setName(savedProfile.name);
    setEmail(savedProfile.email);
    setPassword('');
    setAlert(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);

    if (!trimmedName || trimmedName.length > 30) {
      setAlert({
        variant: 'error',
        title: 'Invalid name',
        message: 'Name must contain between 1 and 30 characters.',
      });
      return;
    }

    if (!trimmedEmail) {
      setAlert({
        variant: 'error',
        title: 'Invalid email',
        message: 'Email is required.',
      });
      return;
    }

    if (!hasChanges) {
      setAlert({
        variant: 'info',
        title: 'No changes detected',
        message: 'Update your name or email to save changes.',
      });
      return;
    }

    if (!password) {
      setAlert({
        variant: 'error',
        title: 'Password required',
        message: 'Enter your current password to confirm account changes.',
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await updateMe({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: 'Update failed',
          message: response.error.message,
        });
        return;
      }

      setSavedProfile({
        name: response.data.name,
        email: response.data.email,
      });
      setName(response.data.name);
      setEmail(response.data.email);

      setPassword('');
      setAlert({
        variant: 'success',
        title: 'Profile updated',
        message: 'Your account information was updated successfully.',
      });

      router.refresh();
    } catch {
      setAlert({
        variant: 'error',
        title: 'Unexpected error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal() {
    setDeleteConfirmation('');
    setAlert(null);
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeleteConfirmation('');
  }

  async function handleDeleteAccount() {
    setAlert(null);

    if (deleteConfirmation !== 'DELETE') {
      setAlert({
        variant: 'warning',
        title: 'Confirmation required',
        message: 'Type DELETE to confirm account deletion.',
      });
      return;
    }

    try {
      setIsDeleting(true);

      const response = await deleteMe();

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: 'Deletion failed',
          message: response.error.message,
        });
        return;
      }

      await logout().catch(() => null);

      router.replace('/login');
      router.refresh();
    } catch {
      setAlert({
        variant: 'error',
        title: 'Unexpected error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Account</h2>
      <p className="mt-2 text-sm text-gray-600">
        Review your user details, update your profile, or delete your account.
      </p>

      <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
        <p>
          <span className="font-medium">User ID:</span> {initialUser.id}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Name"
          maxLength={30}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSaving || isDeleting}
        />

        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSaving || isDeleting}
        />

        <Input
          type="password"
          label="Current password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Required to save changes"
          disabled={isSaving || isDeleting}
        />

        {alert ? (
          <Alert variant={alert.variant} title={alert.title}>
            {alert.message}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" loading={isSaving}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={resetDraft}
            disabled={isSaving || isDeleting}
          >
            Reset
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-base font-semibold text-red-600">Danger zone</h3>
        <p className="mt-2 text-sm text-gray-600">
          Deleting your account permanently removes your user from Billio.
        </p>

        <div className="mt-4">
          <Button
            type="button"
            variant="danger"
            onClick={openDeleteModal}
            disabled={isSaving || isDeleting}
          >
            Delete account
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 space-x-4 border-t border-gray-200">
        <a
          href="/terms-and-conditions"
          target="_blank"
          className="text-gray-500 hover:underline"
        >
          Terms of Service
        </a>
        <span className="text-gray-500">|</span>
        <a
          href="/privacy-policy"
          target="_blank"
          className="text-gray-500 hover:underline"
        >
          Privacy Policy
        </a>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            This action cannot be undone. Type DELETE to confirm deletion.
          </p>

          <Input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="Type DELETE"
            disabled={isDeleting}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
