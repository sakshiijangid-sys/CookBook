import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CurrencyType } from './currency';
import {
  DayOfWeek,
  GroceryItemRecord,
  MealPlan,
  NutriScanRecord,
  NutritionData,
} from '../types';

const VALID_CURRENCIES: CurrencyType[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'];
const VALID_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function hashStringHex(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function makeSafeDocId(prefix: string, rawKey: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20) || 'doc';
  const slug = rawKey
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  const suffix = hashStringHex(rawKey.toLowerCase().trim());
  const combined = slug ? `${safePrefix}_${slug}_${suffix}` : `${safePrefix}_${suffix}`;
  return combined.slice(0, 128);
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

export interface UserWorkspaceCallbacks {
  onProfile: (data: { exists: boolean; currency: CurrencyType; hiddenRecipeIds: string[] }) => void;
  onMealPlans: (plans: MealPlan[], existingDays: Set<DayOfWeek>) => void;
  onGroceryItems: (items: Record<string, GroceryItemRecord>) => void;
  onNutriScans: (scans: NutriScanRecord[]) => void;
}

export function subscribeUserWorkspace(uid: string, callbacks: UserWorkspaceCallbacks): () => void {
  const userDocPath = `users/${uid}`;
  const unsubProfile = onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        callbacks.onProfile({ exists: false, currency: 'USD', hiddenRecipeIds: [] });
        return;
      }
      const data = snapshot.data();
      const currency = VALID_CURRENCIES.includes(data.currency) ? (data.currency as CurrencyType) : 'USD';
      const hiddenRecipeIds = Array.isArray(data.hiddenRecipeIds)
        ? data.hiddenRecipeIds.filter((id): id is string => typeof id === 'string').slice(0, 500)
        : [];
      callbacks.onProfile({ exists: true, currency, hiddenRecipeIds });
    },
    (error) => handleFirestoreError(error, OperationType.GET, userDocPath)
  );

  const mealPlansPath = `users/${uid}/mealPlans`;
  const mealPlansQuery = query(
    collection(db, 'users', uid, 'mealPlans'),
    where('ownerId', '==', uid)
  );
  const unsubMealPlans = onSnapshot(
    mealPlansQuery,
    (snapshot) => {
      const plans: MealPlan[] = [];
      const existingDays = new Set<DayOfWeek>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const day = data.day as DayOfWeek;
        if (VALID_DAYS.includes(day)) {
          existingDays.add(day);
          plans.push({
            day,
            breakfast: typeof data.breakfast === 'string' && data.breakfast ? data.breakfast : undefined,
            lunch: typeof data.lunch === 'string' && data.lunch ? data.lunch : undefined,
            dinner: typeof data.dinner === 'string' && data.dinner ? data.dinner : undefined,
          });
        }
      });
      callbacks.onMealPlans(plans, existingDays);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, mealPlansPath)
  );

  const groceryPath = `users/${uid}/groceryItems`;
  const groceryQuery = query(
    collection(db, 'users', uid, 'groceryItems'),
    where('ownerId', '==', uid)
  );
  const unsubGrocery = onSnapshot(
    groceryQuery,
    (snapshot) => {
      const map: Record<string, GroceryItemRecord> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (typeof data.itemKey === 'string') {
          map[data.itemKey] = {
            id: docSnap.id,
            itemKey: data.itemKey,
            name: typeof data.name === 'string' ? data.name : data.itemKey,
            amount: typeof data.amount === 'string' ? data.amount : '1',
            unit: typeof data.unit === 'string' ? data.unit : 'unit',
            checked: Boolean(data.checked),
            isCustom: Boolean(data.isCustom),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        }
      });
      callbacks.onGroceryItems(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, groceryPath)
  );

  const nutriPath = `users/${uid}/nutriScans`;
  const nutriQuery = query(
    collection(db, 'users', uid, 'nutriScans'),
    where('ownerId', '==', uid),
    limit(50)
  );
  const unsubNutri = onSnapshot(
    nutriQuery,
    (snapshot) => {
      const scans: NutriScanRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        scans.push({
          id: docSnap.id,
          query: typeof d.query === 'string' ? d.query : '',
          mealName: typeof d.mealName === 'string' ? d.mealName : '',
          isFruitOrVegetable: Boolean(d.isFruitOrVegetable),
          calories: typeof d.calories === 'string' ? d.calories : 'N/A',
          carbohydrates: typeof d.carbohydrates === 'string' ? d.carbohydrates : 'N/A',
          proteins: typeof d.proteins === 'string' ? d.proteins : 'N/A',
          fats: typeof d.fats === 'string' ? d.fats : 'N/A',
          vitamins: Array.isArray(d.vitamins) ? d.vitamins.filter((v): v is string => typeof v === 'string') : [],
          minerals: Array.isArray(d.minerals) ? d.minerals.filter((m): m is string => typeof m === 'string') : [],
          healthScore: typeof d.healthScore === 'number' ? d.healthScore : 50,
          isUnhealthy: Boolean(d.isUnhealthy),
          unhealthyExplanation: typeof d.unhealthyExplanation === 'string' ? d.unhealthyExplanation : '',
          healthyAlternatives: Array.isArray(d.healthyAlternatives) ? d.healthyAlternatives : [],
          funFact: typeof d.funFact === 'string' ? d.funFact : '',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });
      scans.sort((a, b) => {
        const aMs = typeof (a.updatedAt as { toMillis?: () => number })?.toMillis === 'function'
          ? (a.updatedAt as { toMillis: () => number }).toMillis()
          : 0;
        const bMs = typeof (b.updatedAt as { toMillis?: () => number })?.toMillis === 'function'
          ? (b.updatedAt as { toMillis: () => number }).toMillis()
          : 0;
        return bMs - aMs;
      });
      callbacks.onNutriScans(scans.slice(0, 12));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, nutriPath)
  );

  return () => {
    unsubProfile();
    unsubMealPlans();
    unsubGrocery();
    unsubNutri();
  };
}

export async function ensureUserProfile(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        currency: 'USD',
        hiddenRecipeIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedDefaultMealPlansIfEmpty(uid: string, defaultPlans: MealPlan[]): Promise<void> {
  const path = `users/${uid}/mealPlans`;
  try {
    const batch = writeBatch(db);
    let added = 0;
    for (const plan of defaultPlans) {
      const ref = doc(db, 'users', uid, 'mealPlans', plan.day);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const payload: Record<string, unknown> = {
          ownerId: uid,
          day: plan.day,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (plan.breakfast) payload.breakfast = plan.breakfast;
        if (plan.lunch) payload.lunch = plan.lunch;
        if (plan.dinner) payload.dinner = plan.dinner;
        batch.set(ref, payload);
        added++;
      }
    }
    if (added > 0) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCurrencyPreference(
  uid: string,
  currency: CurrencyType,
  profileExists: boolean
): Promise<void> {
  const path = `users/${uid}`;
  const safeCurrency: CurrencyType = VALID_CURRENCIES.includes(currency) ? currency : 'USD';
  try {
    const ref = doc(db, 'users', uid);
    if (!profileExists) {
      await setDoc(ref, {
        ownerId: uid,
        currency: safeCurrency,
        hiddenRecipeIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        currency: safeCurrency,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveHiddenRecipes(
  uid: string,
  hiddenRecipeIds: string[],
  profileExists: boolean
): Promise<void> {
  const path = `users/${uid}`;
  const boundedIds = Array.from(
    new Set(hiddenRecipeIds.map((id) => clampString(id, 128)).filter((id) => id && ID_REGEX.test(id)))
  ).slice(0, 500);

  try {
    const ref = doc(db, 'users', uid);
    if (!profileExists) {
      await setDoc(ref, {
        ownerId: uid,
        currency: 'USD',
        hiddenRecipeIds: boundedIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        hiddenRecipeIds: boundedIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertMealPlanSlot(
  uid: string,
  day: DayOfWeek,
  slot: 'breakfast' | 'lunch' | 'dinner',
  recipeId: string | null,
  existingPlan: MealPlan | undefined,
  dayDocExists: boolean
): Promise<void> {
  if (!VALID_DAYS.includes(day)) return;
  const path = `users/${uid}/mealPlans/${day}`;
  const safeRecipeId = recipeId ? clampString(recipeId, 128) : null;
  if (safeRecipeId && !ID_REGEX.test(safeRecipeId)) return;

  try {
    const ref = doc(db, 'users', uid, 'mealPlans', day);
    if (!dayDocExists) {
      const payload: Record<string, unknown> = {
        ownerId: uid,
        day,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const merged: MealPlan = {
        day,
        breakfast: existingPlan?.breakfast,
        lunch: existingPlan?.lunch,
        dinner: existingPlan?.dinner,
        [slot]: safeRecipeId || undefined,
      };
      if (merged.breakfast) payload.breakfast = merged.breakfast;
      if (merged.lunch) payload.lunch = merged.lunch;
      if (merged.dinner) payload.dinner = merged.dinner;
      await setDoc(ref, payload);
    } else {
      await updateDoc(ref, {
        [slot]: safeRecipeId ? safeRecipeId : deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearRecipeFromMealPlans(
  uid: string,
  recipeId: string,
  mealPlans: MealPlan[],
  existingDays: Set<DayOfWeek>
): Promise<void> {
  const path = `users/${uid}/mealPlans`;
  try {
    const batch = writeBatch(db);
    let ops = 0;
    for (const plan of mealPlans) {
      if (!existingDays.has(plan.day)) continue;
      const updates: Record<string, unknown> = {};
      if (plan.breakfast === recipeId) updates.breakfast = deleteField();
      if (plan.lunch === recipeId) updates.lunch = deleteField();
      if (plan.dinner === recipeId) updates.dinner = deleteField();
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        batch.update(doc(db, 'users', uid, 'mealPlans', plan.day), updates);
        ops++;
      }
    }
    if (ops > 0) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertGroceryItemState(
  uid: string,
  params: {
    itemKey: string;
    name: string;
    amount: string;
    unit: string;
    checked: boolean;
    isCustom: boolean;
  },
  existingRecord?: GroceryItemRecord
): Promise<void> {
  const docId = existingRecord?.id || makeSafeDocId(params.isCustom ? 'custom' : 'ing', params.itemKey);
  const path = `users/${uid}/groceryItems/${docId}`;
  const safeKey = clampString(params.itemKey, 160, 'item') || 'item';
  const safeName = clampString(params.name, 160, safeKey) || safeKey;
  const safeAmount = clampString(params.amount, 40, '1');
  const safeUnit = clampString(params.unit, 40, 'unit');

  try {
    const ref = doc(db, 'users', uid, 'groceryItems', docId);
    if (!existingRecord) {
      await setDoc(ref, {
        ownerId: uid,
        itemKey: safeKey,
        name: safeName,
        amount: safeAmount,
        unit: safeUnit,
        checked: Boolean(params.checked),
        isCustom: Boolean(params.isCustom),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        checked: Boolean(params.checked),
        amount: safeAmount,
        unit: safeUnit,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGroceryItemState(uid: string, docId: string): Promise<void> {
  const path = `users/${uid}/groceryItems/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'groceryItems', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function resetCheckedGroceryItems(
  uid: string,
  records: GroceryItemRecord[]
): Promise<void> {
  const checked = records.filter((r) => r.checked);
  if (checked.length === 0) return;
  const path = `users/${uid}/groceryItems`;
  try {
    const batch = writeBatch(db);
    for (const item of checked) {
      batch.update(doc(db, 'users', uid, 'groceryItems', item.id), {
        checked: false,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveNutriScanRecord(
  uid: string,
  rawQuery: string,
  data: NutritionData,
  existingScans: NutriScanRecord[]
): Promise<void> {
  const normalizedQuery = clampString(rawQuery, 200, data.mealName) || 'food';
  const docId = makeSafeDocId('scan', normalizedQuery.toLowerCase());
  const path = `users/${uid}/nutriScans/${docId}`;
  const existing = existingScans.find((s) => s.id === docId);

  const sanitizedPayload = {
    mealName: clampString(data.mealName, 200, normalizedQuery) || normalizedQuery,
    isFruitOrVegetable: Boolean(data.isFruitOrVegetable),
    calories: clampString(data.calories, 40, 'N/A') || 'N/A',
    carbohydrates: clampString(data.carbohydrates, 40, 'N/A') || 'N/A',
    proteins: clampString(data.proteins, 40, 'N/A') || 'N/A',
    fats: clampString(data.fats, 40, 'N/A') || 'N/A',
    vitamins: Array.isArray(data.vitamins)
      ? data.vitamins.map((v) => clampString(v, 120)).filter(Boolean).slice(0, 15)
      : [],
    minerals: Array.isArray(data.minerals)
      ? data.minerals.map((m) => clampString(m, 120)).filter(Boolean).slice(0, 15)
      : [],
    healthScore: Number.isFinite(Number(data.healthScore))
      ? Math.max(0, Math.min(100, Math.round(Number(data.healthScore))))
      : 50,
    isUnhealthy: Boolean(data.isUnhealthy),
    unhealthyExplanation: clampString(data.unhealthyExplanation, 1000),
    healthyAlternatives: Array.isArray(data.healthyAlternatives)
      ? data.healthyAlternatives
          .map((alt) => ({
            name: clampString(alt?.name, 200),
            description: clampString(alt?.description, 600),
          }))
          .filter((alt) => alt.name.length > 0 && alt.description.length > 0)
          .slice(0, 10)
      : [],
    funFact: clampString(data.funFact, 1000),
  };

  try {
    const ref = doc(db, 'users', uid, 'nutriScans', docId);
    if (!existing) {
      await setDoc(ref, {
        ownerId: uid,
        query: normalizedQuery,
        ...sanitizedPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...sanitizedPayload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearNutriScanRecords(uid: string, scans: NutriScanRecord[]): Promise<void> {
  if (scans.length === 0) return;
  const path = `users/${uid}/nutriScans`;
  try {
    const batch = writeBatch(db);
    for (const scan of scans) {
      batch.delete(doc(db, 'users', uid, 'nutriScans', scan.id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
