export interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export class SlotImpl implements Slot {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _startTime: Date,
    private readonly _endTime: Date
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get startTime(): string {
    return this._startTime.toISOString();
  }

  get endTime(): string {
    return this._endTime.toISOString();
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this._startTime && now <= this._endTime;
  }

  toJSON(): Record<string, string> {
    return {
      id: this._id,
      name: this._name,
      startTime: this._startTime.toISOString(),
      endTime: this._endTime.toISOString()
    };
  }

  static fromJSON(data: Record<string, string>): SlotImpl {
    return new SlotImpl(
      data.id,
      data.name,
      new Date(data.startTime),
      new Date(data.endTime)
    );
  }
} 