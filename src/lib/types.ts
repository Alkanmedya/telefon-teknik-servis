// ==================== REPAIR SYSTEM ====================
export type RepairStatus = 'pending' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'ready' | 'delivered' | 'cancelled';

export interface Customer {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    isBlacklisted?: boolean;
    blacklistReason?: string;
    createdAt: string;
}

export interface Device {
    brand: string;
    model: string;
    serialNumber?: string;
    imei?: string;
    color?: string;
    passwordType: 'pin' | 'pattern' | 'password' | 'none';
    passwordValue: string;
}

export type PhoneFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface DiagnosticMark {
    id: string;
    x: number;
    y: number;
    face: PhoneFace;
    type: 'scratch' | 'crack' | 'dent' | 'missing' | 'discoloration';
    note: string;
}

export interface RepairPhoto {
    id: string;
    dataUrl: string;
    type: 'before' | 'after';
    takenAt: string;
}

export interface RepairRecord {
    id: string;
    ticketNo: string;
    customer: Customer;
    device: Device;
    issueDescription: string;
    status: RepairStatus;
    assignedTo?: string;
    technicianNotes: string;
    diagnosticMarks: DiagnosticMark[];
    photos: RepairPhoto[];
    usedParts: { stockItemId: string; name: string; quantity: number; cost: number }[];
    estimatedCost: number;
    finalCost: number;
    warrantyDays: number;
    signatureDataUrl?: string;
    loanerDeviceId?: string;
    companyId?: string;
    paymentStatus?: 'pending' | 'paid';
    paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer';
    createdAt: string;
    updatedAt: string;
}

// ==================== STOCK SYSTEM ====================
export interface Supplier {
    id: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
}

export interface StockItem {
    id: string;
    name: string;
    category: 'screen' | 'battery' | 'connector' | 'camera' | 'housing' | 'ic' | 'flex' | 'accessory' | 'other';
    brand?: string;
    compatibleModels: string[];
    quantity: number;
    criticalLevel: number;
    buyPrice: number;
    buyCurrency: 'TRY' | 'USD' | 'EUR';
    sellPrice: number;
    supplierId?: string;
    barcode?: string;
    createdAt: string;
}

export interface RMARecord {
    id: string;
    supplierId: string;
    supplierName: string;
    partName: string;
    quantity: number;
    reason: 'defective' | 'wrong-item' | 'damaged-shipping';
    status: 'pending' | 'shipped' | 'refunded' | 'rejected';
    notes?: string;
    createdAt: string;
}

export interface WishlistItem {
    id: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    status: 'pending' | 'ordered' | 'arrived' | 'fulfilled';
    notes?: string;
    createdAt: string;
}

// ==================== SECOND HAND ====================
export type DeviceCondition = 'like-new' | 'good' | 'fair' | 'poor' | 'broken';

export interface SecondHandDevice {
    id: string;
    brand: string;
    model: string;
    imei?: string;
    condition: DeviceCondition;
    buyPrice: number;
    sellPrice?: number;
    status: 'in-stock' | 'listed' | 'sold';
    boughtFrom: string;
    soldTo?: string;
    soldDate?: string;
    notes?: string;
    createdAt: string;
}

// ==================== FINANCE ====================
export type ExpenseCategory = 'rent' | 'bills' | 'salary' | 'marketing' | 'supplies' | 'food' | 'transport' | 'tax' | 'other';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    date: string;
    paidBy?: string;
}

export interface ExchangeRate {
    currency: 'USD' | 'EUR';
    rate: number;
    bank: string;
    lastUpdated: string;
    source: 'manual' | 'api';
}

export interface Income {
    id: string;
    category: 'service' | 'sales' | 'collection' | 'other';
    amount: number;
    description: string;
    date: string;
}

// ==================== CORPORATE ====================
export interface Company {
    id: string;
    name: string;
    taxId?: string;
    address?: string;
    contactPerson: string;
    contactPhone: string;
    balance: number;
    notes?: string;
    createdAt: string;
}

export interface Quote {
    id: string;
    companyId?: string;
    customerName: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    total: number;
    validUntil: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    createdAt: string;
}

// ==================== LOANER ====================
export interface LoanerDevice {
    id: string;
    brand: string;
    model: string;
    imei?: string;
    status: 'available' | 'on-loan';
    currentCustomerId?: string;
    currentCustomerName?: string;
    dueDate?: string;
    notes?: string;
}

// ==================== SCHEDULING ====================
export interface Appointment {
    id: string;
    customerName: string;
    customerPhone: string;
    date: string;
    timeSlot: string;
    deviceModel: string;
    issueDescription: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    notes?: string;
}

// ==================== SETTINGS & MISC ====================
export interface QuickMessage {
    id: string;
    label: string;
    text: string;
    icon?: string;
}

export interface StickyNote {
    id: string;
    text: string;
    color: 'yellow' | 'blue' | 'red' | 'green' | 'purple';
    isCompleted: boolean;
    createdAt: string;
}

export interface DeletedItem {
    id: string;
    originalData: any;
    type: 'repair' | 'customer' | 'stock' | 'expense' | 'quote' | 'supplier' | 'company' | 'secondhand' | 'loaner';
    deletedAt: string;
    description: string;
}

export interface StaffMember {
    id: string;
    name: string;
    role: 'admin' | 'technician' | 'receptionist';
    pin: string;
    isActive: boolean;
}

// ==================== DEVICE TEMPLATES ====================
export interface DeviceTemplate {
    brand: string;
    model: string;
    commonIssues: string[];
    image?: string;
}

// ==================== ACCOUNTING ====================
export interface AccountTransaction {
    id: string;
    entityId: string; // supplierId or companyId
    entityType: 'supplier' | 'company';
    type: 'debt' | 'payment'; // debt: Borçlanma (Mal/Hizmet alımı), payment: Ödeme/Tahsilat
    amount: number;
    description: string;
    date: string;
    createdAt: string;
}

// ==================== APP STATE ====================
export interface AppState {
    repairs: RepairRecord[];
    customers: Customer[];
    stockItems: StockItem[];
    suppliers: Supplier[];
    rmaRecords: RMARecord[];
    wishlist: WishlistItem[];
    secondHandDevices: SecondHandDevice[];
    expenses: Expense[];
    incomes: Income[];
    exchangeRates: ExchangeRate[];
    companies: Company[];
    quotes: Quote[];
    loanerDevices: LoanerDevice[];
    appointments: Appointment[];
    quickMessages: QuickMessage[];
    stickyNotes: StickyNote[];
    deletedItems: DeletedItem[];
    staff: StaffMember[];
    accountTransactions: AccountTransaction[];
    privacyMode: boolean;
    currentUserId: string | null;
}
