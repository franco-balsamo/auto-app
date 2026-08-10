import { View, Text, TextInput, Pressable, FlatList, Linking, StyleSheet } from 'react-native';
import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DirectoryStackParamList } from '@/navigation/RootNavigator';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { confirmDelete } from '@/lib/alerts';
import { WORKSHOP_CATEGORY_LABELS } from '@/lib/workshopCategories';
import type { Review } from '@/types/database';

type Props = NativeStackScreenProps<DirectoryStackParamList, 'WorkshopDetail'>;

const STARS = [1, 2, 3, 4, 5];

function average(reviews: Review[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starRow}>
      {STARS.map((s) => (
        <Pressable key={s} onPress={() => onChange(s)} hitSlop={6}>
          <Text style={[styles.star, s <= value && styles.starFilled]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function WorkshopDetailScreen({ route }: Props) {
  const { workshop } = route.params;
  const { session } = useAuth();
  const { reviews, loading, createReview, updateReview, deleteReview } = useReviews(workshop.id);

  const myReview = reviews.find((r) => r.user_id === session?.user.id);
  const otherReviews = reviews.filter((r) => r.user_id !== session?.user.id);

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState<number>(myReview?.rating ?? 5);
  const [comment, setComment] = useState(myReview?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avg = average(reviews);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const input = { rating, comment: comment.trim() || null };
    const { error } = myReview ? await updateReview(myReview.id, input) : await createReview(input);
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setEditing(false);
  }

  function handleDelete() {
    if (!myReview) return;
    confirmDelete('tu reseña', async () => {
      await deleteReview(myReview.id);
    });
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={otherReviews}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <View>
          <Text style={styles.name}>{workshop.name}</Text>
          <Text style={styles.category}>{WORKSHOP_CATEGORY_LABELS[workshop.category]}</Text>
          {workshop.address && <Text style={styles.meta}>{workshop.address}</Text>}
          {workshop.phone && (
            <Pressable onPress={() => Linking.openURL(`tel:${workshop.phone}`)}>
              <Text style={styles.phone}>{workshop.phone}</Text>
            </Pressable>
          )}

          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{avg != null ? avg.toFixed(1) : '—'}</Text>
            <Text style={styles.ratingCount}>
              {reviews.length === 0 ? 'Sin reseñas todavía' : `${reviews.length} reseña${reviews.length === 1 ? '' : 's'}`}
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Tu reseña</Text>
          {myReview && !editing ? (
            <View style={styles.reviewCard}>
              <Text style={styles.starsReadOnly}>{'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}</Text>
              {myReview.comment && <Text style={styles.comment}>{myReview.comment}</Text>}
              <View style={styles.reviewActions}>
                <Pressable onPress={() => setEditing(true)}>
                  <Text style={styles.actionLink}>Editar</Text>
                </Pressable>
                <Pressable onPress={handleDelete}>
                  <Text style={[styles.actionLink, styles.actionLinkDanger]}>Borrar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.reviewCard}>
              <StarPicker value={rating} onChange={setRating} />
              <TextInput
                style={styles.input}
                placeholder="Contá cómo te fue (opcional)"
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : myReview ? 'Guardar cambios' : 'Publicar reseña'}</Text>
              </Pressable>
              {editing && (
                <Pressable onPress={() => setEditing(false)}>
                  <Text style={styles.actionLink}>Cancelar</Text>
                </Pressable>
              )}
            </View>
          )}

          {otherReviews.length > 0 && <Text style={styles.sectionTitle}>Otras reseñas</Text>}
          {loading && <Text style={styles.meta}>Cargando reseñas...</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          <Text style={styles.starsReadOnly}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>
          {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
          <Text style={styles.reviewDate}>{formatDateTime(item.created_at)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE7DA' },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: '700', color: '#23262B' },
  category: { fontSize: 12, color: '#5B6B73', marginTop: 2, textTransform: 'uppercase' },
  meta: { fontSize: 13, color: '#5B6B73', marginTop: 6 },
  phone: { fontSize: 13, color: '#D98E04', marginTop: 4, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 },
  ratingValue: { fontSize: 28, fontWeight: '700', color: '#23262B' },
  ratingCount: { fontSize: 12, color: '#5B6B73' },
  sectionTitle: { fontSize: 12, color: '#5B6B73', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  reviewCard: { backgroundColor: '#FBF9F4', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#DCD5C4' },
  starRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  star: { fontSize: 24, color: '#DCD5C4' },
  starFilled: { color: '#D98E04' },
  starsReadOnly: { fontSize: 16, color: '#D98E04', letterSpacing: 2 },
  comment: { fontSize: 13, color: '#23262B', marginTop: 6 },
  reviewDate: { fontSize: 11, color: '#5B6B73', marginTop: 6 },
  reviewActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionLink: { fontSize: 12, color: '#5B6B73', fontWeight: '600' },
  actionLinkDanger: { color: '#B44B3E' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCD5C4', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#EDE7DA', fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  errorBox: { backgroundColor: '#F4D9D3', borderRadius: 8, padding: 10, marginTop: 10 },
  errorText: { color: '#B44B3E', fontSize: 12, fontWeight: '600' },
});
