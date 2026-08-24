import React, { useEffect, useState } from "react";

const API_URL = "https://quranteacher1.onrender.com/api";

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts = String(dateString).split("-");

  if (parts.length !== 3) {
    return String(dateString);
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function TeacherProgressPanel({ student }) {
  const [progress, setProgress] = useState({
    memorization: [],
    notes: []
  });

  const [loading, setLoading] = useState(true);
  const [savingMemorization, setSavingMemorization] =
    useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const [memorizationForm, setMemorizationForm] =
    useState({
      memorizationDate: getTodayDate(),
      surah: "",
      fromAyah: "",
      toAyah: "",
      amount: "",
      notes: ""
    });

  const [note, setNote] = useState("");

  useEffect(() => {
    if (student) {
      loadProgress();
    }
  }, [student]);

  const getToken = () => {
    const token = localStorage.getItem(
      "quranTeacherToken"
    );

    if (!token) {
      throw new Error(
        "انتهت جلسة تسجيل الدخول."
      );
    }

    return token;
  };

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/progress/${student.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب متابعة الطالب."
        );
      }

      setProgress({
        memorization: Array.isArray(
          result.memorization
        )
          ? result.memorization
          : [],

        notes: Array.isArray(result.notes)
          ? result.notes
          : []
      });
    } catch (requestError) {
      console.error(
        "Load progress failed:",
        requestError
      );

      setError(
        requestError.message ||
          "تعذر جلب بيانات الحفظ والملاحظات."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMemorizationChange = (
    event
  ) => {
    const { name, value } = event.target;

    setMemorizationForm(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );
  };

  const saveMemorization = async (
    event
  ) => {
    event.preventDefault();

    if (
      !memorizationForm.surah.trim() &&
      !memorizationForm.amount.trim()
    ) {
      setError(
        "أدخل اسم السورة أو مقدار الحفظ."
      );

      return;
    }

    try {
      setSavingMemorization(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/progress/${student.id}/memorization`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`
          },
          body: JSON.stringify({
            memorizationDate:
              memorizationForm.memorizationDate,

            surah:
              memorizationForm.surah.trim(),

            fromAyah:
              memorizationForm.fromAyah,

            toAyah:
              memorizationForm.toAyah,

            amount:
              memorizationForm.amount.trim(),

            notes:
              memorizationForm.notes.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تسجيل الحفظ."
        );
      }

      setMemorizationForm({
        memorizationDate: getTodayDate(),
        surah: "",
        fromAyah: "",
        toAyah: "",
        amount: "",
        notes: ""
      });

      await loadProgress();
    } catch (requestError) {
      console.error(
        "Save memorization failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء تسجيل الحفظ."
      );
    } finally {
      setSavingMemorization(false);
    }
  };

  const deleteMemorization = async (
    id
  ) => {
    if (
      !window.confirm(
        "هل تريد حذف سجل الحفظ هذا؟"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/progress/memorization/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر حذف سجل الحفظ."
        );
      }

      await loadProgress();
    } catch (requestError) {
      console.error(
        "Delete memorization failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء حذف سجل الحفظ."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();

    if (!note.trim()) {
      setError(
        "يرجى كتابة الملاحظة."
      );

      return;
    }

    try {
      setSavingNote(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/progress/${student.id}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`
          },
          body: JSON.stringify({
            note: note.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر إضافة الملاحظة."
        );
      }

      setNote("");

      await loadProgress();
    } catch (requestError) {
      console.error(
        "Save note failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء إضافة الملاحظة."
      );
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (id) => {
    if (
      !window.confirm(
        "هل تريد حذف هذه الملاحظة؟"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/progress/notes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر حذف الملاحظة."
        );
      }

      await loadProgress();
    } catch (requestError) {
      console.error(
        "Delete note failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء حذف الملاحظة."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!student) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid #e8ece9"
      }}
    >
      {error && (
        <div
          style={{
            marginBottom: "15px",
            padding: "11px 13px",
            borderRadius: "8px",
            background: "#fff3f3",
            color: "#a34848",
            border: "1px solid #e6b8b8",
            fontSize: "11px",
            lineHeight: "1.7"
          }}
        >
          {error}
        </div>
      )}

      <h3
        style={{
          margin: "0 0 15px",
          color: "#26382d",
          fontSize: "17px"
        }}
      >
        متابعة الحفظ
      </h3>

      <form
        onSubmit={saveMemorization}
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "12px"
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          التاريخ

          <input
            type="date"
            name="memorizationDate"
            value={
              memorizationForm.memorizationDate
            }
            onChange={
              handleMemorizationChange
            }
            style={{
              height: "42px",
              padding: "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          السورة

          <input
            type="text"
            name="surah"
            value={
              memorizationForm.surah
            }
            onChange={
              handleMemorizationChange
            }
            placeholder="مثال: البقرة"
            style={{
              height: "42px",
              padding: "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          من الآية

          <input
            type="number"
            min="1"
            name="fromAyah"
            value={
              memorizationForm.fromAyah
            }
            onChange={
              handleMemorizationChange
            }
            style={{
              height: "42px",
              padding: "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          إلى الآية

          <input
            type="number"
            min="1"
            name="toAyah"
            value={
              memorizationForm.toAyah
            }
            onChange={
              handleMemorizationChange
            }
            style={{
              height: "42px",
              padding: "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <label
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          مقدار الحفظ

          <input
            type="text"
            name="amount"
            value={
              memorizationForm.amount
            }
            onChange={
              handleMemorizationChange
            }
            placeholder="مثال: نصف صفحة"
            style={{
              height: "42px",
              padding: "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              fontFamily: "inherit"
            }}
          />
        </label>

        <label
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "#536158",
            fontSize: "11px"
          }}
        >
          ملاحظات الحفظ

          <textarea
            name="notes"
            value={
              memorizationForm.notes
            }
            onChange={
              handleMemorizationChange
            }
            rows="3"
            style={{
              padding: "10px",
              border:
                "1px solid #d8dfda",
              borderRadius: "8px",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
        </label>

        <button
          type="submit"
          disabled={savingMemorization}
          style={{
            gridColumn: "1 / -1",
            minHeight: "43px",
            border: "none",
            borderRadius: "8px",
            background: "#1f6f43",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {savingMemorization
            ? "جارٍ الحفظ..."
            : "تسجيل الحفظ"}
        </button>
      </form>

      <h3
        style={{
          margin: "28px 0 15px",
          color: "#26382d",
          fontSize: "17px"
        }}
      >
        سجل الحفظ
      </h3>

      {loading ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#7a847d",
            fontSize: "12px"
          }}
        >
          جارٍ تحميل السجلات...
        </div>
      ) : progress.memorization.length ===
        0 ? (
        <div
          style={{
            padding: "20px",
            borderRadius: "9px",
            background: "#f7f9f7",
            color: "#7a847d",
            textAlign: "center",
            fontSize: "12px"
          }}
        >
          لا توجد سجلات حفظ لهذا الطالب.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {progress.memorization.map(
            (record) => (
              <div
                key={record.id}
                style={{
                  padding: "13px",
                  border:
                    "1px solid #e2e8e4",
                  borderRadius: "9px",
                  background: "#ffffff"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between"
                  }}
                >
                  <strong
                    style={{
                      color: "#26382d",
                      fontSize: "13px"
                    }}
                  >
                    {record.surah || "حفظ"}
                  </strong>

                  <span
                    style={{
                      color: "#7a847d",
                      fontSize: "10px"
                    }}
                  >
                    {formatDate(
                      record.memorization_date
                    )}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "7px",
                    color: "#536158",
                    fontSize: "11px",
                    lineHeight: "1.8"
                  }}
                >
                  {record.from_ayah &&
                  record.to_ayah
                    ? `من الآية ${record.from_ayah} إلى الآية ${record.to_ayah}`
                    : record.amount ||
                      "لم يحدد المقدار"}
                </div>

                {record.notes && (
                  <div
                    style={{
                      marginTop: "7px",
                      color: "#7a847d",
                      fontSize: "10px"
                    }}
                  >
                    {record.notes}
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    deletingId ===
                    record.id
                  }
                  onClick={() =>
                    deleteMemorization(
                      record.id
                    )
                  }
                  style={{
                    marginTop: "9px",
                    minHeight: "30px",
                    padding: "0 10px",
                    border:
                      "1px solid #d8a4a4",
                    borderRadius: "7px",
                    background: "#ffffff",
                    color: "#a34848",
                    fontFamily: "inherit",
                    fontSize: "10px",
                    cursor: "pointer"
                  }}
                >
                  {deletingId === record.id
                    ? "..."
                    : "حذف السجل"}
                </button>
              </div>
            )
          )}
        </div>
      )}

      <h3
        style={{
          margin: "28px 0 15px",
          color: "#26382d",
          fontSize: "17px"
        }}
      >
        ملاحظات المعلم
      </h3>

      <form
        onSubmit={saveNote}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="اكتب ملاحظة عن الطالب..."
          rows="4"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            border:
              "1px solid #d8dfda",
            borderRadius: "8px",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            fontSize: "12px"
          }}
        />

        <button
          type="submit"
          disabled={savingNote}
          style={{
            minHeight: "43px",
            border: "none",
            borderRadius: "8px",
            background: "#1f6f43",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {savingNote
            ? "جارٍ إضافة الملاحظة..."
            : "إضافة الملاحظة"}
        </button>
      </form>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        {progress.notes.length === 0 ? (
          <div
            style={{
              padding: "20px",
              borderRadius: "9px",
              background: "#f7f9f7",
              color: "#7a847d",
              textAlign: "center",
              fontSize: "12px"
            }}
          >
            لا توجد ملاحظات لهذا الطالب.
          </div>
        ) : (
          progress.notes.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "13px",
                border:
                  "1px solid #e2e8e4",
                borderRadius: "9px",
                background: "#ffffff"
              }}
            >
              <p
                style={{
                  margin: "0",
                  color: "#26382d",
                  fontSize: "12px",
                  lineHeight: "1.8"
                }}
              >
                {item.note}
              </p>

              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between"
                }}
              >
                <span
                  style={{
                    color: "#7a847d",
                    fontSize: "9px"
                  }}
                >
                  {new Date(
                    item.created_at
                  ).toLocaleString("ar-DZ")}
                </span>

                <button
                  type="button"
                  disabled={
                    deletingId ===
                    item.id
                  }
                  onClick={() =>
                    deleteNote(item.id)
                  }
                  style={{
                    minHeight: "29px",
                    padding: "0 9px",
                    border:
                      "1px solid #d8a4a4",
                    borderRadius: "7px",
                    background: "#ffffff",
                    color: "#a34848",
                    fontFamily: "inherit",
                    fontSize: "9px",
                    cursor: "pointer"
                  }}
                >
                  {deletingId === item.id
                    ? "..."
                    : "حذف"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TeacherProgressPanel;