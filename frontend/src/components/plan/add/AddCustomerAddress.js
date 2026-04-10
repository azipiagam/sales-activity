import { apiRequest } from '../../../services/api';

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();

    if (payload?.message) return payload.message;

    if (payload?.errors && typeof payload.errors === 'object') {
      const firstKey = Object.keys(payload.errors)[0];
      const firstError = payload.errors[firstKey];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
  } catch (error) {
    // Ignore parse errors and use fallback message.
  }

  return fallbackMessage;
};

const toNumberOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const normalizeAddressPayload = (item, customerId) => {
  if (!item) return null;

  const mappedCustomerId = item.customer_id ?? item.customerId ?? customerId ?? '';

  return {
    id: String(item.id ?? ''),
    customerId: String(mappedCustomerId),
    address: String(item.address ?? '').trim(),
    latitude: toNumberOrNull(item.lat ?? item.latitude),
    longitude: toNumberOrNull(item.lng ?? item.longitude),
    isDefault: Boolean(item.is_default ?? item.isDefault),
    source: item.source ?? (item.is_default ? 'master' : 'custom'),
    createdAt: item.created_at ?? item.createdAt ?? null,
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
  };
};

const toRequestBody = (payload = {}) => ({
  address: String(payload.address ?? '').trim(),
  lat: toNumberOrNull(payload.lat ?? payload.latitude),
  lng: toNumberOrNull(payload.lng ?? payload.longitude),
});

export const getCustomerAddresses = async (customerId) => {
  const response = await apiRequest(`customers/${encodeURIComponent(customerId)}/addresses`);

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Gagal mengambil daftar alamat customer.');
    throw new Error(message);
  }

  const data = await response.json();
  const addresses = Array.isArray(data) ? data : [];

  return addresses
    .map((item) => normalizeAddressPayload(item, customerId))
    .filter(Boolean);
};

export const createCustomerAddress = async (customerId, payload) => {
  const response = await apiRequest(`customers/${encodeURIComponent(customerId)}/addresses`, {
    method: 'POST',
    body: JSON.stringify(toRequestBody(payload)),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Gagal menambahkan alamat customer.');
    throw new Error(message);
  }

  const data = await response.json();
  return normalizeAddressPayload(data?.data, customerId);
};

export const updateCustomerAddress = async (customerId, addressId, payload) => {
  const response = await apiRequest(
    `customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(toRequestBody(payload)),
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Gagal memperbarui alamat customer.');
    throw new Error(message);
  }

  const data = await response.json();
  return normalizeAddressPayload(data?.data, customerId);
};

export const deleteCustomerAddress = async (customerId, addressId) => {
  const response = await apiRequest(
    `customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Gagal menghapus alamat customer.');
    throw new Error(message);
  }

  return true;
};
