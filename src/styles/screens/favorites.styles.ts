import { StyleSheet } from 'react-native';

export const favoritesStyles = StyleSheet.create({
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
    paddingBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  exploreBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#6366F1', borderRadius: 16,
  },
  exploreBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Grid
  grid: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
});
