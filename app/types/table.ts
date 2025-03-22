import type { PropType } from 'vue';

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  id: string;
  sortable?: boolean;
  class?: string;
}