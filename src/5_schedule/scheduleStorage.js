// 저장 시점 사이의 변화를 일정 ID별로 비교합니다.
export function mergeScheduleChanges(base, local, remote) {
  const toMap = schedules => new Map(schedules.map(item => [String(item.id), item]));
  const original = toMap(base);
  const current = toMap(local);
  const otherTab = toMap(remote);
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const merged = [];

  const ids = new Set([...original.keys(), ...current.keys(), ...otherTab.keys()]);
  for (const id of ids) {
    const before = original.get(id);
    const localItem = current.get(id);
    const remoteItem = otherTab.get(id);
    const localChanged = !same(before, localItem);
    const remoteChanged = !same(before, remoteItem);

    if (localChanged && remoteChanged && !same(localItem, remoteItem)) {
      return { conflict: true, items: local };
    }
    const item = localChanged ? localItem : remoteItem;
    if (item) merged.push(item);
  }
  return { conflict: false, items: merged };
}
