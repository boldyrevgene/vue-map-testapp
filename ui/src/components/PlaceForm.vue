<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

import type { LngLat, Place } from '@/models'
import { PLACE_TYPES_LIST, PlaceType } from '@/models'
import { mapIconService } from '@/services/map-icon-service'

const props = defineProps<{ place: Partial<Place> }>()
const emit = defineEmits(['submitted', 'canceled'])

// local state with no references to places-store
// so form changes have no affect on global state
const form = reactive({
    name: props.place.name ?? '',
    type: props.place.type ?? null,
    lng: (props.place.coordinates?.[0] ?? null) as number | null,
    lat: (props.place.coordinates?.[1] ?? null) as number | null,
    description: props.place.description ?? '',
})

const typeIcons = ref<Partial<Record<PlaceType, string>>>({})

onMounted(async () => {
    // icons with the same appearance as on the map
    const entries = await Promise.all(
        PLACE_TYPES_LIST.map(async type => {
            const { src } = await mapIconService.getMarkerImage(type, 'selected', 28)
            return [type, src] as const
        })
    )
    typeIcons.value = Object.fromEntries(entries)
})

const placeTypes = PLACE_TYPES_LIST

// element+ based validators
const formRef = ref<FormInstance>()

// spetial caracters validator
const FORBIDDEN_CHARS_PATTERN = /[<>{}[\]\\]/
const validateNoSpecialChars =
    (_rule: unknown, value: string | undefined, callback: (err?: Error) => void) => {
        if (!value) {
            callback() // empty is fine here — `required` handles it where applicable
            return
        }
        if (FORBIDDEN_CHARS_PATTERN.test(value)) {
            callback(new Error('Forbidden characters: < > { } [ ] \\'))
        } else {
            callback()
        }
    }

const rules: FormRules = {
    name: [
        { required: true, message: 'Name is required', trigger: 'blur' },
        { validator: validateNoSpecialChars, trigger: 'blur' },
    ],
    type: [
        { required: true, message: 'Type is required', trigger: 'change' },
    ],
    lng: [
        { required: true, message: 'Longitude is required', trigger: 'blur' },
    ],
    lat: [
        { required: true, message: 'Latitude is required', trigger: 'blur'},
    ],
    description: [
        { validator: validateNoSpecialChars, trigger: 'blur' },
    ],
}


const submitBtnLabel = computed(() => !props.place.id ? 'Create' : 'Save')

const submitBtnClicked = ref<boolean>(false)
async function onSubmit() {
    try {
        await formRef.value?.validate()
    } catch (err) {
        submitBtnClicked.value = true
        // form data is invalid - abort submission
        return
    }

    const data = {
        name: form.name,
        type: form.type,
        coordinates: [form.lng, form.lat] as LngLat,
        ...(form.description ? { description: form.description } : {}),
    }

    emit('submitted', data)
}

function validateField(field: string) {
    if (!submitBtnClicked.value) {
        return
    }
    formRef.value?.validateField(field).catch(() => {})
}

</script>

<template>
    <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        require-asterisk-position="right"
        class="place-form"
        @submit.prevent="onSubmit"
    >
        <el-form-item label="Name" prop="name">
            <el-input v-model="form.name" @input="validateField('name')"/>
        </el-form-item>

        <el-form-item label="Type" prop="type">
            <el-select
                v-model="form.type" size="large"
                @change="validateField('type')"
                placeholder="select type"
                class="place-form__type-select"
            >
                <template v-if="form.type && typeIcons[form.type as PlaceType]" #prefix>
                    <img
                        :src="typeIcons[form.type as PlaceType]"
                        class="place-form__type-icon"
                        alt=""
                    />
                </template>

                <el-option
                    v-for="type in placeTypes"
                    :key="type"
                    :value="type"
                    :label="type"
                >
                    <span class="place-form__option">
                        <img
                            v-if="typeIcons[type]"
                            :src="typeIcons[type]"
                            class="place-form__type-icon"
                            alt=""
                        />
                        {{ type }}
                    </span>
                </el-option>
            </el-select>
        </el-form-item>

        <div class="place-form__coords">
            <el-form-item label="lng" prop="lng">
                <el-input-number
                    v-model="form.lng"
                    @input="validateField('lng')"
                    :min="-180"
                    :max="180"
                    :precision="6"
                    :controls="false"
                    class="place-form__coord-input"
                />
            </el-form-item>
            <el-form-item label="lat" prop="lat">
                <el-input-number
                    v-model="form.lat"
                    @input="validateField('lat')"
                    :min="-90"
                    :max="90"
                    :precision="6"
                    :controls="false"
                    class="place-form__coord-input"
                />
            </el-form-item>
        </div>

        <el-form-item label="Description" prop="description">
            <el-input
                v-model="form.description"
                @input="validateField('description')"
                type="textarea" :rows="4"
                resize="none"
            />
        </el-form-item>

        <el-form-item class="place-form__actions">
            <el-button
                v-if="!!props.place.id"
                type="danger"
                @click="emit('canceled')"
            >
                Cancel
            </el-button>
            <el-button type="primary" native-type="submit">{{ submitBtnLabel }}</el-button>
        </el-form-item>
    </el-form>
</template>

<style scoped lang="scss">
.place-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    :deep(.el-form-item__label) {
        margin-bottom: 4px;
    }

    &__type-select {
        width: 100%;
    }

    &__type-icon {
        display: block;
        height: 28px;
        object-fit: contain;
    }

    &__option {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__coords {
        display: flex;
        gap: 12px;

        .el-form-item {
            flex: 1;
            min-width: 0;
        }
    }

    &__coord-input {
        width: 100%;

        :deep(.el-input__inner) {
            text-align: left;
        }
    }

    &__actions {
        margin-top: auto;
        margin-bottom: 0;

        :deep(.el-form-item__content) {
            justify-content: right;
        }
    }
}
</style>