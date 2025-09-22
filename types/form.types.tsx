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

export const availableKeys = [
  "⁠115mm grinding discs - 10 off",
  " ⁠115mm cutting discs - 20 off ",
  " ⁠Welding lens auto dark - 5 off",
  "⁠ ⁠Welding lens shade - 5 off",
  "⁠ ⁠Welding  class clear - 5 off",
  "⁠ ⁠Anti spatter can- 2 off",
  "⁠ ⁠Welding tips and adaptors - 5 off",
  "⁠ ⁠14 mm slugger - 2 off",
  "⁠30 mm slugger - 2 off"
];