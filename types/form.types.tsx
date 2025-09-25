
export interface Component {
  id: string;
  name: string;
  isWithdrawal: boolean;
  subComponents: SubComponent[];
}

export interface SubComponent {
  id: string;
  key: string;
  value: string;
  componentId: string;
}