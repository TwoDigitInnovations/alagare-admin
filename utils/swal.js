import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const swalSuccess = (title, text = "") =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#4a6d00",
  });

export const swalError = (title, text = "") =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#4a6d00",
  });

export const swalConfirm = async (title, text = "This action cannot be undone.") => {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#4a6d00",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

export const toastSuccess = (title) => Toast.fire({ icon: "success", title });
export const toastError = (title) => Toast.fire({ icon: "error", title });

export default Swal;
