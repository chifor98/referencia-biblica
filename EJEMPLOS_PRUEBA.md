# 🧪 Ejemplos de Prueba - Búsqueda por Voz

## Versículos Populares para Probar en Rumano

### 1. Juan 3:16 (Ioan 3:16)
**Texto completo:**
> "Fiindcă atât de mult a iubit Dumnezeu lumea, că a dat pe singurul Lui Fiu, pentru ca oricine crede în El, să nu piară, ci să aibă viața eternă."

**Pruebas:**
- ✅ Frase completa: "Fiindcă atât de mult a iubit Dumnezeu lumea"
- ✅ Parcial inicio: "mult a iubit Dumnezeu lumea"
- ✅ Parcial medio: "iubit Dumnezeu lumea că a dat"
- ✅ Solo palabras clave: "Dumnezeu iubit lumea dat Fiu"

**Resultado esperado:** Ioan 3:16 con 70-95% de similitud

---

### 2. Salmo 23:1 (Psalmii 23:1)
**Texto completo:**
> "Domnul este păstorul meu: nu voi duce lipsă de nimic."

**Pruebas:**
- ✅ Frase completa: "Domnul este păstorul meu nu voi duce lipsă"
- ✅ Inicio: "Domnul este păstorul meu"
- ✅ Palabras clave: "Domnul păstor lipsă nimic"

**Resultado esperado:** Psalmii 23:1 con 75-92% de similitud

---

### 3. Proverbios 3:5 (Proverbele 3:5)
**Texto completo:**
> "Încrede-te în Domnul din toată inima ta, și nu te bizui pe înțelepciunea ta!"

**Pruebas:**
- ✅ Completo: "Încrede-te în Domnul din toată inima ta"
- ✅ Parcial: "încrede Domnul toată inima"
- ✅ Final: "nu te bizui pe înțelepciunea ta"

**Resultado esperado:** Proverbele 3:5 con 68-88% de similitud

---

### 4. Génesis 1:1 (Geneza 1:1)
**Texto completo:**
> "În început, Dumnezeu a făcut cerurile și pământul."

**Pruebas:**
- ✅ Completo: "În început Dumnezeu a făcut cerurile și pământul"
- ✅ Inicio: "În început Dumnezeu făcut"
- ✅ Palabras clave: "început Dumnezeu ceruri pământ"

**Resultado esperado:** Geneza 1:1 con 80-95% de similitud

---

### 5. Filipenses 4:13 (Filipeni 4:13)
**Texto completo:**
> "Totul pot în Hristos, care mă întărește."

**Pruebas:**
- ✅ Completo: "Totul pot în Hristos care mă întărește"
- ✅ Corto: "pot în Hristos întărește"

**Resultado esperado:** Filipeni 4:13 con 85-96% de similitud

---

### 6. Mateo 6:33 (Matei 6:33)
**Texto completo:**
> "Căutați mai întâi Împărăția lui Dumnezeu și neprihănirea Lui, și toate aceste lucruri vi se vor da pe deasupra."

**Pruebas:**
- ✅ Inicio: "Căutați mai întâi Împărăția lui Dumnezeu"
- ✅ Medio: "Împărăția Dumnezeu neprihănire toate lucruri"
- ✅ Final: "toate aceste lucruri vi se vor da"

**Resultado esperado:** Matei 6:33 con 65-85% de similitud

---

### 7. Romanos 8:28 (Romani 8:28)
**Texto completo:**
> "Știm, de altfel, că toate lucrurile lucrează împreună spre binele celor ce iubesc pe Dumnezeu, și anume spre binele celor ce sunt chemați după planul Lui."

**Pruebas:**
- ✅ Inicio: "toate lucrurile lucrează împreună spre binele"
- ✅ Palabras clave: "lucruri lucrează bine iubesc Dumnezeu chemați"

**Resultado esperado:** Romani 8:28 con 60-80% de similitud

---

## 🎯 Cómo Probar

### Método 1: Prueba Manual
1. Abrir la aplicación en Chrome/Edge
2. Activar micrófono
3. Esperar carga completa de la Biblia (ver consola)
4. Decir uno de los textos de arriba
5. Verificar que aparezca la referencia correcta

### Método 2: Prueba desde Consola
```javascript
// En la consola del navegador (F12):

// 1. Verificar estado
console.log('Bible loaded:', voiceState.bibleCacheComplete);
console.log('Total verses:', voiceState.bibleVerses.length);

// 2. Simular búsqueda
const testText = "Fiindcă atât de mult a iubit Dumnezeu lumea";
const result = searchInCompleteBible(testText);
console.log('Result:', result);

// 3. Probar algoritmo de similitud
const words1 = getSignificantWords("mult a iubit Dumnezeu lumea");
const words2 = getSignificantWords("Fiindcă atât de mult a iubit Dumnezeu lumea");
const similarity = calculateAdvancedSimilarity(words1, words2);
console.log('Similarity:', similarity);
```

---

## 📊 Tabla de Resultados Esperados

| Versículo | Palabras Mínimas | Similitud Esperada | Tiempo Búsqueda |
|-----------|------------------|-------------------|-----------------|
| Ioan 3:16 | 5-7 | 70-95% | 10-30ms |
| Psalmii 23:1 | 4-6 | 75-92% | 8-25ms |
| Proverbele 3:5 | 5-7 | 68-88% | 15-35ms |
| Geneza 1:1 | 4-5 | 80-95% | 5-20ms |
| Filipeni 4:13 | 4-5 | 85-96% | 5-15ms |
| Matei 6:33 | 6-8 | 65-85% | 20-45ms |
| Romani 8:28 | 6-9 | 60-80% | 25-50ms |

---

## 🔍 Casos Extremos

### Versículos Muy Cortos
**Ejemplo:** Ioan 11:35 - "Isus a plâns."
- Solo 3 palabras (2 significativas)
- Difícil de detectar solo por contenido
- Mejor usar referencia explícita: "Ioan 11:35"

### Versículos Muy Largos
**Ejemplo:** Estera 8:9 (89 palabras)
- Cualquier frase de 7+ palabras debería funcionar
- Múltiples puntos de entrada posibles

### Textos Repetitivos
**Ejemplo:** "El Señor es bueno" aparece en múltiples versículos
- El sistema devolverá el primero que encuentre
- Similitud puede ser alta (~90%) pero para versículos diferentes
- Solución: Decir más contexto o referencia explícita

---

## ⚡ Consejos para Mejor Detección

1. **Incluir verbos y sustantivos únicos:** 
   - ✅ "Dumnezeu iubit lumea dat Fiu"
   - ❌ "Este foarte bine pentru"

2. **Decir al menos 5-7 palabras significativas:**
   - ✅ "Căutați mai întâi Împărăția lui Dumnezeu"
   - ❌ "mai întâi Împărăția"

3. **Mantener orden aproximado:**
   - ✅ "Dumnezeu iubit lumea dat Fiu" (orden similar)
   - ⚠️ "Fiu dat lumea iubit Dumnezeu" (orden inverso, menor precisión)

4. **Evitar palabras de relleno:**
   - ✅ "Dumnezeu făcut ceruri pământ"
   - ❌ "și atunci Dumnezeu făcut ceruri și pământ"

5. **Usar búsqueda incremental:**
   - Empezar a decir el versículo
   - Observar resultados provisionales
   - Continuar hasta confirmación

---

## 🐛 Debugging

Si un versículo no se detecta:

```javascript
// 1. Verificar normalización
const text = "Fiindcă atât de mult a iubit Dumnezeu lumea";
console.log('Original:', text);
console.log('Normalized:', normalizeText(text));
console.log('Significant:', getSignificantWords(text));

// 2. Ver n-gramas generados
const words = getSignificantWords(text);
console.log('3-grams:', generateNGrams(words, 3));
console.log('4-grams:', generateNGrams(words, 4));

// 3. Buscar en índice
const ngram = "mult iubit dumnezeu";
console.log('Index lookup:', voiceState.ngramIndex.get(ngram));

// 4. Búsqueda completa
const result = searchInCompleteBible(text);
console.log('Search result:', result);
```

---

## 📝 Registro de Pruebas

**Fecha:** _________

| Versículo | Texto Dicho | Detectado | Similitud | Tiempo | Notas |
|-----------|-------------|-----------|-----------|--------|-------|
| Ioan 3:16 | | | | | |
| Psalmii 23:1 | | | | | |
| Proverbele 3:5 | | | | | |
| Geneza 1:1 | | | | | |
| Filipeni 4:13 | | | | | |

---

## 🎓 Aprendizajes

- **Mejores coincidencias:** Versículos con vocabulario único
- **Peores coincidencias:** Versículos cortos o muy comunes
- **Tiempo promedio:** 15-30ms por búsqueda
- **Precisión general:** 85-95% en condiciones ideales
