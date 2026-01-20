import * as DialogPrimitive from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay className={clsx('ui-dialog-overlay', className)} {...props} />
);

export const DialogContent = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content className={clsx('ui-dialog-content', className)} {...props} />
  </DialogPrimitive.Portal>
);

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
