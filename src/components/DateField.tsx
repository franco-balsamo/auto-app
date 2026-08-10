import { useState } from 'react';
import { Pressable, Text, View, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function parseDate(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// convierte getDay() (0=domingo) a índice con lunes=0
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export default function DateField({ value, onChange, placeholder = 'Elegir fecha', required = false }: Props) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'days' | 'monthYear'>('days');
  const [viewDate, setViewDate] = useState(() => parseDate(value));

  function open() {
    setViewDate(parseDate(value));
    setMode('days');
    setShow(true);
  }

  function changeMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function pickDay(day: number) {
    onChange(toDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)));
    setShow(false);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = mondayIndex(new Date(year, month, 1).getDay());
  const selected = value ? parseDate(value) : null;

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 5 + i);

  return (
    <View>
      <Pressable style={styles.input} onPress={open}>
        <Text style={value ? styles.value : styles.placeholder}>{value ? formatDate(value) : placeholder}</Text>
      </Pressable>

      {value && !required && (
        <Pressable onPress={() => onChange('')}>
          <Text style={styles.clear}>Quitar fecha</Text>
        </Pressable>
      )}

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShow(false)}>
          <Pressable style={styles.card}>
            <View style={styles.header}>
              <Pressable hitSlop={12} onPress={() => changeMonth(-1)} disabled={mode === 'monthYear'}>
                <Text style={[styles.nav, mode === 'monthYear' && styles.navDisabled]}>‹</Text>
              </Pressable>
              <Pressable onPress={() => setMode(mode === 'days' ? 'monthYear' : 'days')}>
                <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
              </Pressable>
              <Pressable hitSlop={12} onPress={() => changeMonth(1)} disabled={mode === 'monthYear'}>
                <Text style={[styles.nav, mode === 'monthYear' && styles.navDisabled]}>›</Text>
              </Pressable>
            </View>

            {mode === 'monthYear' ? (
              <View style={styles.wheelRow}>
                <Picker
                  style={styles.wheel}
                  itemStyle={styles.wheelItem}
                  selectedValue={month}
                  onValueChange={(m) => setViewDate(new Date(year, Number(m), 1))}
                >
                  {MONTHS.map((m, i) => (
                    <Picker.Item key={m} label={m} value={i} color="#23262B" />
                  ))}
                </Picker>
                <Picker
                  style={styles.wheel}
                  itemStyle={styles.wheelItem}
                  selectedValue={year}
                  onValueChange={(y) => setViewDate(new Date(Number(y), month, 1))}
                >
                  {years.map((y) => (
                    <Picker.Item key={y} label={String(y)} value={y} color="#23262B" />
                  ))}
                </Picker>
              </View>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={i} style={styles.weekday}>{w}</Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {cells.map((day, i) => {
                    const isSelected =
                      day != null &&
                      selected != null &&
                      selected.getFullYear() === year &&
                      selected.getMonth() === month &&
                      selected.getDate() === day;
                    return (
                      <Pressable
                        key={i}
                        style={[styles.cell, isSelected && styles.cellSelected]}
                        disabled={day == null}
                        onPress={() => day != null && pickDay(day)}
                      >
                        {day != null && (
                          <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>{day}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Pressable
              style={styles.doneBtn}
              onPress={() => (mode === 'monthYear' ? setMode('days') : setShow(false))}
            >
              <Text style={styles.doneBtnText}>{mode === 'monthYear' ? 'Listo' : 'Cerrar'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#FBF9F4', borderWidth: 1, borderColor: '#DCD5C4', borderRadius: 8, padding: 12 },
  value: { fontSize: 14, color: '#23262B' },
  placeholder: { fontSize: 14, color: '#8B8577' },
  clear: { fontSize: 12, color: '#B44B3E', marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(35,38,43,0.5)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nav: { fontSize: 22, color: '#D98E04', fontWeight: '700', paddingHorizontal: 12 },
  navDisabled: { color: '#DCD5C4' },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#23262B', textTransform: 'capitalize' },
  wheelRow: { flexDirection: 'row' },
  wheel: { flex: 1 },
  wheelItem: { fontSize: 18, color: '#23262B', height: 120 },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: '#5B6B73', fontWeight: '600', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellSelected: { backgroundColor: '#D98E04' },
  cellText: { fontSize: 14, color: '#23262B' },
  cellTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  doneBtn: { backgroundColor: '#23262B', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  doneBtnText: { color: '#EDE7DA', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
});
