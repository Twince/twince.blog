/// <reference types="astro/client" />

declare module 'astro-icon' {
  import type { HTMLAttributes } from 'astro/types';

  export interface Props extends HTMLAttributes<'svg'> {
    name: string;
    pack?: string;
    size?: number | string;
  }

  export const Icon: (props: Props) => any;
}