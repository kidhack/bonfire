import * as TabsPrimitive from '@radix-ui/react-tabs';
import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={clsx('ui-reset ui-tabs-list', className)} {...props} />
);

export const TabsTrigger = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={clsx('ui-reset ui-focus ui-tabs-trigger', className)} {...props} />
);

export const TabsContent = TabsPrimitive.Content;
