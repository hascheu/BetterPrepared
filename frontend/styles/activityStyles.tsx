import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: '#f5f5f7' 
  },
  center: { 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    marginTop: 10, 
    color: '#1c1c1e', 
    textAlign: 'center' 
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 15, 
    // Zukunftssicheres boxShadow für Web/iOS:
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    // Elevation bleibt wichtig für Android-Schatten:
    elevation: 2 
  },
  innerCard: { 
    backgroundColor: '#f8f8fa', 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 5, 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#007AFF', 
    marginBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f2', 
    paddingBottom: 6 
  },
  fieldBlock: { 
    marginBottom: 10 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  label: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 6, 
    fontWeight: '500' 
  },
  labelHeader: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 12, 
    fontWeight: '600' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e5e5ea', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12, 
    fontSize: 16, 
    backgroundColor: '#fff' 
  },
  inputError: { 
    borderColor: '#ff3b30', 
    backgroundColor: '#fff9f9' 
  },
  switchContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  selectRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 12, 
    gap: 8 
  },
  inlineSelect: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 4, 
    backgroundColor: '#fff', 
    padding: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e5e5ea', 
    marginBottom: 12 
  },
  optionBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 10, 
    backgroundColor: '#e5e5ea' 
  },
  optionBadgeSelected: { 
    backgroundColor: '#007AFF' 
  },
  weekdayBadge: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#e5e5ea', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  miniWeekdayBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 5, 
    borderRadius: 6, 
    backgroundColor: '#e5e5ea', 
    flex: 1, 
    alignItems: 'center' 
  },
  optionText: { 
    color: '#333', 
    fontSize: 13, 
    textAlign: 'center' 
  },
  miniOptionText: { 
    color: '#333', 
    fontSize: 11, 
    fontWeight: '500' 
  },
  optionTextSelected: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  typeBadge: { 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#007AFF' 
  },
  typeBadgeSelected: { 
    backgroundColor: '#007AFF' 
  },
  typeBadgeText: { 
    color: '#007AFF', 
    fontWeight: '600', 
    fontSize: 13 
  },
  typeBadgeTextSelected: { 
    color: '#fff' 
  },
  addButton: { 
    padding: 10, 
    backgroundColor: '#e1f0ff', 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 5 
  },
  addButtonText: { 
    color: '#007AFF', 
    fontWeight: '600' 
  },
  saveButton: { 
    backgroundColor: '#34c759', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 20 
  },
  saveButtonDisabled: { 
    backgroundColor: '#aeaea2' 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  slotRowContainer: { 
    marginBottom: 5 
  }
});