import { StyleSheet } from 'react-native';

export const productsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowOrb: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    opacity: 0.7,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: '#22D3EE' },

  // Sort Dropdown
  sortDropdown: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, minWidth: 160,
  },
  sortOptionActive: { backgroundColor: 'rgba(34,211,238,0.08)' },
  sortOptionText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  sortOptionTextActive: { color: '#F8FAFC', fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 20, marginBottom: 16, position: 'relative' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingHorizontal: 16, height: 50,
    gap: 10,
  },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 15 },

  // Search Dropdown
  searchDropdown: {
    position: 'absolute', top: 56, left: 20, right: 20,
    backgroundColor: '#1E293B', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    overflow: 'hidden', paddingVertical: 8,
  },
  searchDropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchDropdownImage: {
    width: 36, height: 36, borderRadius: 8, marginRight: 12, backgroundColor: '#334155'
  },
  searchDropdownInfo: { flex: 1, justifyContent: 'center' },
  searchDropdownName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginBottom: 2 },
  searchDropdownCat: { fontSize: 11, color: '#64748B', fontWeight: 'bold' },
  searchDropdownEmpty: { padding: 16, alignItems: 'center' },
  searchDropdownEmptyText: { color: '#64748B', fontSize: 13 },
  searchDropdownMore: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  searchDropdownMoreText: { color: '#6366F1', fontSize: 13, fontWeight: '700' },

  // Categories
  categoriesRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  catPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  catPillTextActive: { color: '#FFF' },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  clearBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#6366F1', borderRadius: 16,
  },
  clearBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Grid
  grid: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
});
