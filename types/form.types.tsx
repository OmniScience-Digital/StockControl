export interface SubComponent {
  id: string;
  key: string;
  value: number;
  isWithdrawal: boolean;
}

export interface Component {
  id: string;
  name: string;
  subComponents: SubComponent[];
}
