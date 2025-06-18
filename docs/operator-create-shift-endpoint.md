# Создание смены оператором

## Описание

Новый эндпоинт для создания смены оператором с использованием EAN/GTIN кода продукции.

## Эндпоинт

```
POST /shift/operator/create
```

## Авторизация

- Требуется JWT токен с типом `JWT_TYPE.Operator`
- Из токена извлекается `operatorId` (поле `sub`)

## Входные данные

### Request Body

```typescript
{
  ean: string;        // EAN код продукции (8-14 цифр)
  plannedDay?: Date;  // Плановая дата (опционально, по умолчанию - сегодня)
}
```

### Примеры запросов

#### 1. С указанием плановой даты

```json
{
  "ean": "1234567890123",
  "plannedDay": "2025-06-20T00:00:00.000Z"
}
```

#### 2. Без указания плановой даты (будет использована текущая дата)

```json
{
  "ean": "12345678"
}
```

## Логика работы

1. **Преобразование EAN в GTIN**: Если длина EAN меньше 14 символов, код дополняется ведущими нулями до 14 символов.

2. **Поиск продукта**: По полученному GTIN ищется продукт со статусом `ACTIVE`.

3. **Создание смены**: Создается новая смена со следующими параметрами:
   - `productId` - ID найденного продукта
   - `operatorId` - ID оператора из JWT токена
   - `plannedDate` - плановая дата (из запроса или текущая дата)
   - `status` - `PLANNED`
   - `packing` - `false`

## Ответ

### Успешный ответ (201 Created)

```typescript
{
  result: {
    id: string;
    plannedDate: Date;
    product: {
      id: string;
      shortName: string;
      fullName: string;
      gtin: string;
      alcoholCode: string;
      expirationInDays: number;
      volume: Decimal;
      pictureUrl: string | null;
      status: ProductStatus;
      created: Date;
      modified: Date | null;
    }
    productId: string;
    plannedCount: number | null;
    factCount: number | null;
    packing: boolean;
    countInBox: number | null;
    status: ShiftStatus;
    operatorId: string;
    created: Date;
    modified: Date | null;
  }
}
```

### Ошибки

#### 400 Bad Request

- Отсутствует `operatorId` в JWT токене
- Данные смены не уникальны

#### 404 Not Found

- Продукт с указанным GTIN не найден или неактивен

#### 401 Unauthorized

- Отсутствует или недействительный JWT токен

## Использование

### cURL пример

```bash
curl -X POST http://localhost:3000/shift/operator/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ean": "1234567890123",
    "plannedDay": "2025-06-20T00:00:00.000Z"
  }'
```

### JavaScript/TypeScript пример

```typescript
const response = await fetch('/shift/operator/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // для передачи JWT cookie
  body: JSON.stringify({
    ean: '1234567890123',
    plannedDay: new Date('2025-06-20'),
  }),
});

const data = await response.json();
```
