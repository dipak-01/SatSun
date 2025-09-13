export function byOrder(a, b) {
  return (a?.order ?? 0) - (b?.order ?? 0);
}

export function sortByOrder(list = []) {
  return list.slice().sort(byOrder);
}
